//Handles the popup.html UI and injects script.js into the tab

const indicator = document.getElementById('indicator');

chrome.runtime.onMessage.addListener( function(message, sender, sendResponse){
    console.log("message recieved: ",message);
    indicator.textContent = message;
})


//maybe add a js command so that when message is greater than .5, the indicator turns red and when its below turns green.