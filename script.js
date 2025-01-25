// Send prediction result back to popup
function sendPredictionResult(result) {
    chrome.runtime.sendMessage({
        type: "prediction",
        result: result
    });
}

//handles the ONNX model and frame prediction
let ort;

// Configure ONNX Runtime Web.js
const options = {
    executionProviders: ['cpu'],
    graphOptimizationLevel: 'all'
};

//initialize the onnxruntime-web lib
async function initializeOnnx(){
    try {
        // Create a promise that resolves when ONNX Runtime is ready
        const ortReady = new Promise((resolve, reject) => {
            // Dynamically load ONNX Runtime
            const ortScript = document.createElement('script');
            ortScript.src = chrome.runtime.getURL('node_modules/onnxruntime-web/dist/ort.min.js');
            
            ortScript.onload = () => {
                // Wait for next tick to ensure ort is defined
                setTimeout(() => {
                    if (typeof window.ort !== 'undefined') {
                        ort = window.ort;
                        console.log('onnxruntime-web initialized');
                        resolve();
                    } else {
                        reject(new Error('Failed to load ONNX Runtime'));
                    }
                }, 100);
            };
            
            ortScript.onerror = () => {
                reject(new Error('Failed to load ONNX Runtime script'));
            };
            
            document.head.appendChild(ortScript);
        });

        await ortReady;
        return true;
    } catch (error) {
        console.error('Error initializing onnxruntime-web:', error);
        return false;
    }
}

//load the onnx inference model
async function loadSession(){
    try {
        if (typeof ort === 'undefined') {
            throw new Error('ONNX Runtime not initialized');
        }
        const modelPath = chrome.runtime.getURL('model.onnx');
        console.log('Loading model from:', modelPath);
        const session = await ort.InferenceSession.create(modelPath, options);
        console.log('model loaded successfully');
        return session;
    } catch (error) {
        console.error('Error loading the model:', error);
        throw error;
    }
}

//if video exists then capture frame will be called
//within capture frame we call videoProcessing function
async function captureFrame(session){
    const frame_num = 10; //number of frames to capture
    let result;
    for (let i = 0; i < frame_num; i++){
        const video = document.querySelector("video");
        if (video) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            let canvas_width = video.width || video.videoWidth;
            let canvas_height = video.height || video.videoHeight;
            canvas.width = canvas_width;
            canvas.height = canvas_height;
            context.drawImage(video, 0, 0, canvas_width, canvas_height);
            const imageData = context.getImageData(0, 0, canvas_width, canvas_height);
            const img_input = new ort.Tensor('float32', imageData.data, [1, 3, canvas_height, canvas_width]);
            result = await videoProcessing(session, img_input);
        }
    }
    return result;
}

async function videoProcessing(session, tensors){
    try {
        //process the tensors here
        const result = await session.run({input: tensors});
        const prediction = Array.from(result.output.data)[0];
        console.log('Prediction result:', prediction);
        return prediction;
    } catch (error) {
        console.error('Error processing video:', error);
        throw error;
    }
}

// Initialize everything in sequence
async function init() {
    try {
        console.log('Starting initialization...');
        const initialized = await initializeOnnx();
        if (!initialized) {
            throw new Error('Failed to initialize ONNX Runtime');
        }
        console.log('ONNX Runtime initialized, loading session...');
        const session = await loadSession();
        console.log('Session loaded successfully');
        return session;
    } catch (error) {
        console.error('Initialization failed:', error);
        throw error;
    }
}

// Start the initialization
init().then(async session => {
    console.log('Ready to process video');
    const video = document.querySelector("video");
    if (!video) {
        console.log('No videos');
        sendPredictionResult(0);
    } else {
        console.log('Processing video...');
        const result = await captureFrame(session);
        console.log('Processing complete, result:', result);
        sendPredictionResult(result);
    }
}).catch(error => {
    console.error('Failed to initialize:', error);
    sendPredictionResult(-1); // Send error indicator
});