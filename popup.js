document.addEventListener("DOMContentLoaded", () => {
    const captureBtn = document.getElementById("capture-btn");
    const framesContainer = document.getElementById("frames-container");
    const probabilityText = document.getElementById("probability");
    const riskStatus = document.getElementById("risk-status");
    const feedbackContainer = document.getElementById("feedback-container");
    const realBtn = document.getElementById("real-btn");
    const fakeBtn = document.getElementById("fake-btn");
    const certaintySlider = document.getElementById("certainty-slider");
    const certaintyValue = document.getElementById("certainty-value");

    let videoFrames = [];

    // Capture button functionality
    captureBtn.addEventListener("click", async () => {
        try {
            let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab || tab.url.startsWith("chrome://")) {
                alert("⚠ This extension cannot run on Chrome system pages. Try analyzing a video on a website.");
                return;
            }

            // Inject content script and start capturing frames
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["content.js"]
            });

            chrome.tabs.sendMessage(tab.id, { type: "capture_video" });

            // Reset UI
            framesContainer.innerHTML = "";
            probabilityText.innerText = "--%";
            riskStatus.innerText = "Analyzing...";
            feedbackContainer.style.display = "none";
        } catch (error) {
            alert("⚠ Cannot analyze video on this page. Try another website.");
        }
    });

    // Update certainty slider value dynamically
    certaintySlider.addEventListener("input", () => {
        certaintyValue.innerText = certaintySlider.value;
    });

    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === "video_frame") {
            // Append captured frame to the UI
            let img = document.createElement("img");
            img.src = message.frame;
            img.className = "video-frame";
            framesContainer.appendChild(img);
            videoFrames.push(message.frame);
        } else if (message.type === "video_frames_done") {
            // Simulate prediction result
            let probability = Math.floor(Math.random() * 100);

            // Display prediction and update UI
            setTimeout(() => {
                probabilityText.innerText = probability + "%";

                if (probability > 60) {
                    probabilityText.style.color = "red";
                    riskStatus.innerText = "High Risk: Likely Fake";
                    feedbackContainer.style.display = "none";
                } else if (probability < 40) {
                    probabilityText.style.color = "green";
                    riskStatus.innerText = "Low Risk: Likely Real";
                    feedbackContainer.style.display = "none";
                } else {
                    probabilityText.style.color = "orange";
                    riskStatus.innerText = "Uncertain - Please Verify";
                    feedbackContainer.style.display = "block";
                }
            }, 500);
        } else if (message.type === "no_video_detected") {
            alert("⚠ No video detected on this page. Please try again.");
        }
    });

    // Save user feedback to local storage
    function storeFeedback(isFake) {
        let feedbackData = {
            timestamp: new Date().toISOString(),
            frames: videoFrames,
            probability: probabilityText.innerText,
            user_label: isFake ? "Fake" : "Real",
            certainty: certaintySlider.value,
        };

        chrome.storage.local.get({ dataset: [] }, (result) => {
            let dataset = result.dataset;
            dataset.push(feedbackData);
            chrome.storage.local.set({ dataset: dataset }, () => {
                console.log("Feedback saved:", feedbackData);

                // Hide feedback section after submission
                feedbackContainer.style.display = "none";

                alert("✅ Thank you for your feedback!");
            });
        });
    }

    // Handle real/fake feedback buttons
    realBtn.addEventListener("click", () => storeFeedback(false));
    fakeBtn.addEventListener("click", () => storeFeedback(true));
});
