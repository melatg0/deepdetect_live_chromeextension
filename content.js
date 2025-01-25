// Prevent multiple injections
if (window.hasRun) {
    console.log('Content script already injected');
} else {
    window.hasRun = true;
    initializeContentScript();
}

function initializeContentScript() {
    console.log('Initializing content script');
    
    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "checkForVideo") {
            const videos = document.getElementsByTagName('video');
            console.log('Found video elements:', videos.length);
            sendResponse({ found: videos.length > 0, count: videos.length });
        }
        return true; // Keep the message channel open for async response
    });

    // Create observer instance
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeName === 'VIDEO') {
                        console.log('New video element detected');
                        chrome.runtime.sendMessage({
                            action: "videoDetected"
                        });
                    }
                });
            }
        });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // Initial video check
    const videos = document.getElementsByTagName('video');
    if (videos.length > 0) {
        console.log('Videos found during initial check:', videos.length);
        chrome.runtime.sendMessage({
            action: "videoDetected"
        });
    }
}
