import { cubeMoveRight, cubeMoveLeft } from "/script.js";

// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/FqZXoTdGm/";

let model, webcam, labelContainer, maxPredictions;

// Load the image model and setup the webcam
async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // or files from your local hard drive
  // Note: the pose library adds "tmImage" object to your window (window.tmImage)
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const flip = true; // whether to flip the webcam
  webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  window.requestAnimationFrame(loop);

  // append elements to the DOM
  document.getElementById("webcam-container").appendChild(webcam.canvas);
  labelContainer = document.getElementById("label-container");
  for (let i = 0; i < maxPredictions; i++) {
    // and class labels
    labelContainer.appendChild(document.createElement("div"));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("button");
  startButton.addEventListener("click", init);
});

async function loop() {
  webcam.update(); // update the webcam frame
  await predict();
  window.requestAnimationFrame(loop);
}
let prediction, steerRightProbability, steerLeftProbability;
// run the webcam image through the image model
async function predict() {
  // predict can take in an image, video or canvas html element
  prediction = await model.predict(webcam.canvas);
  for (let i = 0; i < maxPredictions; i++) {
    const classPrediction =
      prediction[i].className + ": " + prediction[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }
  steerRightProbability = prediction.find(
    (item) => item.className === "turnRight"
  ).probability;

  steerLeftProbability = prediction.find(
    (item) => item.className === "turnLeft"
  ).probability;
}

setInterval(() => {
  if (steerRightProbability >= 0.4) {
    console.log(steerRightProbability);
    cubeMoveRight();
  } else if (steerLeftProbability >= 0.7) {
    cubeMoveLeft();
  }
}, 100);
