import { cubeMoveRight, cubeMoveLeft } from "/script.js";

const URL = "https://teachablemachine.withgoogle.com/models/wkOKbeb71/";

let model, webcam, labelContainer, maxPredictions;

// Load the image model and setup the webcam
async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const flip = true;
  webcam = new tmImage.Webcam(200, 200, flip);
  await webcam.setup();
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
    (item) => item.className === "tiltRight"
  ).probability;

  steerLeftProbability = prediction.find(
    (item) => item.className === "tiltLeft"
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
