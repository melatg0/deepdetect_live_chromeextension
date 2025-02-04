console.log("DeepFake Detector: Background script loaded");

// Check if background detection is enabled
chrome.storage.local.get("backgroundDetection", (result) => {
    if (result.backgroundDetection) {
        monitorVideos();
    }
});

function monitorVideos() {
    chrome.webNavigation.onCompleted.addListener(async (details) => {
        if (details.url.startsWith("http")) {
            try {
                let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["content.js"]
                });
                chrome.tabs.sendMessage(tab.id, { type: "capture_video" });
            } catch (error) {
                console.error("Error monitoring video:", error);
            }
        }
    });

    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((message, sender) => {
        if (message.type === "video_fake_detected") {
            // Pop out the extension when a fake video is detected
            chrome.action.openPopup();
            console.log("DeepFake Detector: Popup opened for fake video.");
        }
    });
}
