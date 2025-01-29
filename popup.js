document.addEventListener('DOMContentLoaded', async function() {
    const indicator = document.getElementById('indicator');
    const body = document.body;
    
    indicator.textContent = 'Checking for videos...';
    
    try {
        // Get the active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs[0];

        // Send message to content script to check for videos
        chrome.tabs.sendMessage(activeTab.id, { action: "checkForVideo" }, async function(response) {
            if (chrome.runtime.lastError || !response) {
                console.log('Content script not yet injected or not responding.');
                indicator.textContent = 'No response, injecting content script...';
                
                try {
                    // Inject content script
                    await chrome.scripting.executeScript({
                        target: { tabId: activeTab.id },
                        files: ['content.js']
                    });

                    // Retry checking for videos
                    chrome.tabs.sendMessage(activeTab.id, { action: "checkForVideo" }, handleVideoCheckResponse);
                } catch (error) {
                    console.error('Failed to inject content script:', error);
                    indicator.textContent = 'Error: Could not check for videos';
                }
                
                return;
            }
            
            handleVideoCheckResponse(response);
        });
    } catch (error) {
        console.error('Error:', error);
        indicator.textContent = 'Error: ' + error.message;
    }
});

// Handle the response from content.js about video detection
function handleVideoCheckResponse(response) {
    const indicator = document.getElementById('indicator');

    if (response && response.found) {
        console.log('Videos found:', response.count);
        indicator.textContent = 'Processing video...';
    } else {
        console.log('No videos found');
        indicator.textContent = 'No videos found on this page';
    }
}

// Listen for messages from content script or script.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const indicator = document.getElementById('indicator');
    const body = document.body;

    console.log('Received message:', message);
    
    if (message.type === "prediction") {
        console.log('Received prediction:', message.result);
        indicator.textContent = `Deepfake probability: ${message.result}`;

        // Change background color based on prediction
        body.style.backgroundColor = message.result > 0.5 ? 'red' : 'green';
        indicator.style.color = 'black';
    } else if (message.action === "videoDetected") {
        indicator.textContent = 'Processing video...';
    }

    return true; // Keep message channel open for async response
});
