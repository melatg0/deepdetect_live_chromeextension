//handles the ONNX model and frame prediction. Will send a message to popup.js to update the popup with the prediction
import * as ort from 'onnxruntime-web';
//onnxruntime-web must be installed beforehand
//npm install onnxruntime-web

async function loadSession(){
    const session = await ort.InferenceSession.create("model.onnx");
    return session;
}

async function videoProcessing(){
    const video = document.getElementsByTagName("video");
    if (video.length == 0){
        console.log('No videos')
        return
    } else {
        console.log(video.length,'videos found')
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, )
        
    }
}




const output = await session.run();//model output