//Handles the popup.html UI and injects script.js into the tab

const indicator = document.getElementById('indicator'); //element where the deepfake result will be posted
const body = document.getElementById('body'); //for background update. 


// When popup opens, check for videos on the active tab
document.addEventListener('DOMContentLoaded', async function() {
    indicator.textContent = 'Checking for videos...';
    
    try {
        // Get the active tab
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        const activeTab = tabs[0];
        
        // Send message to content script
        chrome.tabs.sendMessage(activeTab.id, {
            action: "checkForVideo",
            tabId: activeTab.id
        }, async function(response) {
            if (chrome.runtime.lastError) {
                console.log('Content script not yet injected, injecting now...');
                try {
                    // Inject content script
                    await chrome.scripting.executeScript({
                        target: { tabId: activeTab.id },
                        files: ['content.js']
                    });
                    
                    // Try sending the message again after injection
                    chrome.tabs.sendMessage(activeTab.id, {
                        action: "checkForVideo",
                        tabId: activeTab.id
                    }, function(response) {
                        handleVideoCheckResponse(response);
                    });
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

function handleVideoCheckResponse(response) {
    if (response && response.found) {
        console.log('Videos found:', response.count);
        indicator.textContent = 'Processing video...';
        // Inject script.js for video processing
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                files: ['script.js']
            }).catch(error => {
                console.error('Failed to inject script.js:', error);
                indicator.textContent = 'Error: Failed to start video processing';
            });
        });
    } else {
        console.log('No videos found');
        indicator.textContent = 'No videos found on this page';
    }
}

// Listen for messages from content script or script.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message:', message);
    
    if (message.type === "prediction") {
        console.log('Received prediction:', message.result);
        // Update UI with prediction result
        indicator.textContent = `Deepfake probability: ${message.result}`;
        
        // Update background color based on prediction
        if (message.result > 0.5) {
            body.style.backgroundColor = 'red';
            indicator.style.color = 'black';
        } else {
            body.style.backgroundColor = 'green';
            indicator.style.color = 'black';
        }
    } else if (message.action === "videoDetected") {
        indicator.textContent = 'Processing video...';
    }
    
    return true; // Keep message channel open for async response
});
