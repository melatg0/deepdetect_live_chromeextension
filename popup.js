//Handles the popup.html UI and injects script.js into the tab

const indicator = document.getElementById('indicator'); //element where the deepfake result will be posted
const body = document.getElementById(); //for background update. 

//listens for messages from the script.js and changes the indicator text



//injector for script.js
//if issues arise check allframes boolean
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ["script.js"],
    })
        .then(() => console.log("script injected"))
        .catch((error) => console.error("script injection failed:", error));
});



//listens and recieves the result from script.js
chrome.runtime.onMessage.addListener( function(message, sender, sendResponse){
    console.log("message recieved: ",message);
    indicator.textContent = message;
})

//changes background color and indicator text color based on the message value
if (message > .5){
    body.style.backgroundColor = 'red';
    indicator.style.color = 'black';
} else {
    body.style.backgroundColor = 'green';
    indicator.style.color = 'black';
}


//maybe add a js command so that when message is greater than .5, the indicator turns red and when its below turns green.

