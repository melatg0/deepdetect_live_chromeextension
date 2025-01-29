// Wait for ONNX Runtime to be ready
document.addEventListener('DOMContentLoaded', async () => {
    const status = document.getElementById('status');
    const predictionDisplay = document.getElementById('prediction');
    const predictionContainer = document.getElementById('predictionDisplay');
    
    // Function to update display based on prediction
    function updatePredictionDisplay(prediction) {
        predictionDisplay.textContent = prediction.toFixed(4);
        
        // Remove previous classes
        predictionDisplay.classList.remove('real', 'fake');
        predictionContainer.classList.remove('real', 'fake');
        
        // Add appropriate class based on prediction
        if (prediction < 0.5) {
            predictionDisplay.classList.add('real');
            predictionContainer.classList.add('real');
            status.textContent = 'Status: Real Video Detected';
        } else {
            predictionDisplay.classList.add('fake');
            predictionContainer.classList.add('fake');
            status.textContent = 'Status: Deepfake Detected';
        }
    }
    
    try {
        status.textContent = 'Status: Checking ONNX Runtime...';
        
        // Wait for ONNX Runtime to be available
        let attempts = 0;
        const maxAttempts = 10;
        while (!window.ort && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        if (!window.ort) {
            throw new Error('ONNX Runtime failed to load after ' + maxAttempts + ' attempts');
        }
        
        status.textContent = 'Status: Initializing ONNX Runtime...';
        
        // Configure ONNX Runtime
        const options = {
            executionProviders: ['cpu'],
            graphOptimizationLevel: 'all'
        };

        // Load the model
        status.textContent = 'Status: Loading model...';
        const modelPath = '/model.onnx';
        const session = await window.ort.InferenceSession.create(modelPath, options);
        
        status.textContent = 'Status: Model loaded successfully';
        console.log('Model loaded successfully');

        // Set up video processing
        const video = document.querySelector('video');
        if (!video) {
            status.textContent = 'Status: No video found';
            predictionDisplay.textContent = '0';
            return;
        }

        // Function to convert image data to tensor
        function imageDataToTensor(imageData) {
            const pixels = imageData.data;
            const red = new Float32Array(160 * 160);
            const green = new Float32Array(160 * 160);
            const blue = new Float32Array(160 * 160);
            
            // Separate RGB channels and normalize
            for (let i = 0; i < 160 * 160; i++) {
                red[i] = pixels[i * 4] / 255.0;     // R value
                green[i] = pixels[i * 4 + 1] / 255.0; // G value
                blue[i] = pixels[i * 4 + 2] / 255.0;  // B value
            }
            
            // Combine channels into final array
            const data = new Float32Array(3 * 160 * 160);
            data.set(red, 0);
            data.set(green, 160 * 160);
            data.set(blue, 2 * 160 * 160);
            
            return new window.ort.Tensor('float32', data, [1, 3, 160, 160]);
        }

        video.addEventListener('play', () => {
            status.textContent = 'Status: Processing video...';
            
            const processFrame = async () => {
                if (!video.paused && !video.ended) {
                    try {
                        // Create canvas and get frame data
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.width = 160;
                        canvas.height = 160;
                        context.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        // Process frame
                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                        const tensor = imageDataToTensor(imageData);
                        
                        // Run inference
                        const result = await session.run({ input: tensor });
                        const prediction = Array.from(result.output.data)[0];
                        
                        // Update display with color
                        updatePredictionDisplay(prediction);
                        
                        // Process next frame
                        requestAnimationFrame(processFrame);
                    } catch (error) {
                        console.error('Error processing frame:', error);
                        status.textContent = 'Status: Error processing frame - ' + error.message;
                    }
                }
            };
            
            processFrame();
        });

    } catch (error) {
        console.error('Initialization error:', error);
        status.textContent = 'Status: Error - ' + error.message;
        predictionDisplay.textContent = '-1';
    }
});
