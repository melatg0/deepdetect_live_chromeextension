/*
// Handle communication between content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Forward messages from content script to popup and vice versa
    if (sender.tab) {
        // Message from content script, forward to popup
        chrome.runtime.sendMessage(message);
    } else {
        // Message from popup, forward to content script
        if (message.tabId) {
            chrome.tabs.sendMessage(message.tabId, message);
        }
    }
    return true;
});

// Listen for tab updates to inject script.js when needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.match(/^https?:\/\//)) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['script.js']
        }).catch(err => console.error('Failed to inject script:', err));
    }
});
*/
