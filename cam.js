// Check if the browser supports getUserMedia
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Access the webcam
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            // Assign the stream to the video element
            const video = document.getElementById('webcam');
            video.srcObject = stream;
            video.play();
        })
        .catch(function (error) {
            console.error('Error accessing webcam:', error);
        });
} else {
    console.error('getUserMedia is not supported in this browser.');
}
