//handles the ONNX model and frame prediction. Will send a message to popup.js to update the popup with the prediction
//onnxruntime-web must be installed beforehand
//npm install onnxruntime-web


import * as ort from 'onnxruntime-web';


//initialize the onnxruntime-web lib
async function initializeOnnx(){
    await ort.ready();
    console.log('onnxruntime-web initialized');
}

//load the onnx inference model
async function loadSession(){
    const session = await ort.InferenceSession.create("model.onnx");
    console.log('model loaded');
    return session;
}

async function videoProcessing(session, tensors){
    //process the tensors here
    const result = await session.run({input: tensors});
    return result
    }



//if video exists then capture frame will be called
//within capture frame we call videoProcessing function

//frame capture function
function captureFrame(session){
    const frame_num = 10; //number of frames to capture
    for (let i = 0; i<frame_num; i++){
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        let canvas_width = video.width;
        let canvas_height = video.height;
        context.drawImage(video, 0, 0, canvas_width, canvas_height);
        const imageData = context.getImageData(0, 0, video.width, video.height);
        const img_input = new ort.Tensor('float32', imageData.data, [1, 3, video.width, video.height]);
        let result = videoProcessing(session, img_input);
    }
    return result
}


initializeOnnx(); //initialize the onnxruntime-web
const session = loadSession(); //load the model

const video = document.getElementsByTagName("video"); //search for video element
if (video.length == 0){
    console.log('No videos') //if collection of video element is length 0 no video msg is sent
    return
} else {
    const result = captureFrame(session); //result holds the model prediction because videoProcessing is called within captureFrame

    //send message to popup.js
    chrome.runtime.sendMessage(result, function(){
        console.log('message sent');
})
}

