console.log("DeepFake Detector: Content Script Loaded");

function captureFramesRealTime(videoElement) {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    let frameCount = 0;
    let maxFrames = 10;
    let captureInterval = 200;

    function capture() {
        if (frameCount >= maxFrames) {
            console.log("DeepFake Detector: Finished capturing 10 frames.");

            // Notify the popup that frame capture is complete
            chrome.runtime.sendMessage({ type: "video_frames_done" });

            return;
        }

        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        let frameData = canvas.toDataURL("image/png");

        chrome.runtime.sendMessage({ type: "video_frame", frame: frameData });

        frameCount++;
        setTimeout(capture, captureInterval);
    }

    capture();
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "capture_video") {
        let videos = document.getElementsByTagName("video");
        if (videos.length > 0) {
            captureFramesRealTime(videos[0]);
        } else {
            chrome.runtime.sendMessage({ type: "no_video_detected" });
        }
    }
});
