// 1. Definition of global variables
// Variable for MobileNet-model that later recognizes images
let classifier;

// List of image paths that will be automatically classified
const imageSources = [
  "./bildDateien/cat.jpg",
  "./bildDateien/banana.jpeg",
  "./bildDateien/castle.jpeg",
  "./bildDateien/trees.jpg",
  "./bildDateien/fruits.jpg",
  "./bildDateien/flower-field.jpg",
];

// Array for storing the classification results
const resultsArray = [];

// 2. Function that creates a visual card for an image
function createCard(imgSrc, labelText, percent, color) {
  // Retrieves HTML template from index.html
  const template = document.getElementById("cardTemplate");
  // Copies the template so that multiple cards can be created
  const clone = template.content.cloneNode(true);

  // Accesses the different elements within the card
  const card = clone.querySelector(".card");
  const img = clone.querySelector(".image");
  const label = clone.querySelector(".label");

  // Sets image and text
  img.src = imgSrc;
  label.innerText = labelText;

  // Returns the completed card
  return card;
}

// 3. Plugin for Chart.js that writes text into center of the doughnut chart
const centerTextPlugin = {
  beforeDraw(chart) {
    // Object Destructuring -> extracts values ​​directly from objects into variables
    const { ctx, width, height } = chart;

    // Gets the Confidence value
    const value = chart.config.data.datasets[0].data[0];

    // Saves current state of canvas like color, font and text-align
    ctx.save();

    // Styles regarding the text inside the Doghnut Chart can only be set inside JS-file
    // Cannot be styled externally in CSS-file
    ctx.font =
      "bold 14px 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', sans-serif"; // Set font properties
    ctx.fillStyle = "#000000"; // Set color of text to black
    ctx.textAlign = "center"; // Align text to center on vertical line
    ctx.textBaseline = "middle"; // Align text to center on horizontal line

    // Draws percentage value in the middle of doughnut chart and sets characteristics
    ctx.fillText((value * 1).toFixed(2) + " %", width / 2, height / 2);

    // Restores saved state -> Everything changed after `save()` will be reseted
    ctx.restore();

    // Without `save()` / `restore()`: Text styling would affect other chart elements or subsequent drawings
    // would look incorrect
  },
};

// 4. Function that classifies all images from imageSources
async function setup() {
  // Creates HTML canvas element with a height and width of 400px
  createCanvas(400, 400);

  // Get animated Loader
  const loaderCorrect = document.getElementById("loaderCorrect");
  const loaderWrong = document.getElementById("loaderWrong");

  // Make loading animations visible
  loaderCorrect.classList.remove("hidden");
  loaderWrong.classList.remove("hidden");

  // Loading AI ​​model
  classifier = await ml5.imageClassifier("MobileNet");

  // Get containers for correct and wrong classification
  const korrektContainer = document.querySelector(".korrektKlassifiziert");
  const falschContainer = document.querySelector(".falschKlassifiziert");

  // 4.1 Classify and save all images
  // For every image...
  for (let src of imageSources) {
    // ... load image
    const img = new Image();
    img.src = src;

    // ... wait until image is loaded
    await new Promise((resolve) => (img.onload = resolve));

    // ... classified by AI
    const results = await classifier.classify(img);

    // ... get result on first position
    const label = results[0].label;
    const confidence = results[0].confidence;

    // ... save result in 'resultsArray'
    resultsArray.push({
      src,
      label,
      confidence,
    });
  }

  // 4.2 Sort by highest confidence first
  resultsArray.sort((a, b) => b.confidence - a.confidence);

  // 4.3 Rendering
  // For every result...
  for (let item of resultsArray) {
    // ... convert confidence of AI ​​into percentage
    const percent = item.confidence * 100;

    // ... check if percent is smaller or larger then 50 and set it red or green depending on result
    const color = percent < 50 ? "#f44336" : "#2b9326";

    // ... create a card containing image, label and confidence
    const card = createCard(item.src, item.label, percent.toFixed(2), color);

    // ... append card to either container 'korrektContainer' or 'falschContainer', depending on
    // whether the percentage is above or below 50
    if (percent >= 50) {
      korrektContainer.appendChild(card);
    } else {
      falschContainer.appendChild(card);
    }

    // ... search within the newly created card for an element with the class '.chart'
    const canvas = card.querySelector(".chart");

    // ... create a doughnut chart for the confidence based on the previously created 'canves'
    new Chart(canvas, {
      // Creates a diagram of type 'doughnut'
      type: "doughnut",

      // Sets the characteristics for the diagram
      data: {
        // Labels for the two parts the diagram
        labels: ["Confidence", "Rest"],
        datasets: [
          {
            // Actual values:
            // percent → confidence
            // 100 - percent → rest
            data: [percent, 100 - percent],
            // Colors of the two areas:
            // color → green or red (depending on confidence)
            // #ccc8c8 → gray for the rest
            backgroundColor: [color, "#ccc8c8"],
          },
        ],
      },
      options: {
        // Chart doesn't automatically adjust to the size of the website
        responsive: false,

        //Removes the default legend ("Confidence", "Rest") as instead,
        // the percentage value is displayed directly in the chart
        plugins: {
          legend: { display: false },
        },
      },
      // Adds custom plugin that writes percentage value in the center of the donut
      plugins: [centerTextPlugin],
    });
  }

  // Hide Loader
  loaderCorrect.classList.add("hidden");
  loaderWrong.classList.add("hidden");
}

// 5. Ensure that code only runs once the page has loaded
document.addEventListener("DOMContentLoaded", async function () {
  // Loading AI ​​model
  classifier = await ml5.imageClassifier("MobileNet");

  // 5.1 Upload function
  document
    // Retrieve HTML element with the ID 'upload' - here <input type="file">
    .getElementById("upload")
    // Responds to the "change" event when a user selects a file
    .addEventListener("change", function (event) {
      // Accesses the selected file
      const file = event.target.files[0];

      // Checks if a file exists and only proceeds if a file actually exists
      if (file) {
        // Creates a Object that can read files in the browser
        const reader = new FileReader();

        // Function that will be executed when the file has finished loading
        reader.onload = function (e) {
          // Retrieves the image-element for the preview
          const img = document.getElementById("preview");

          // Sets the image and the uploaded image will appear on the page
          img.src = e.target.result;

          // Makes the image visible if it was previously hidden
          img.style.display = "block";
        };

        // Starts reading the file
        reader.readAsDataURL(file);
      }
    });

  // 5.2 Classification-Button
  document
    // Retrieve HTML element with the ID 'classify' - here <button id="classify">
    .getElementById("classify")
    // Responds to the "click" event when a user clicks the button 'Classify →'
    .addEventListener("click", async function () {
      // Retrieves HTML elements
      const img = document.getElementById("preview");
      const resultsLabel = document.getElementById("resultsLabel");
      const errorMessageClassify = document.getElementById(
        "errorMessageClassify",
      );
      const canvas = document.getElementById("uploadChart");

      // Old errors are deleted
      errorMessageClassify.innerText = "";

      // Check if picture has been selected
      if (!img.src || img.src === window.location.href) {
        errorMessageClassify.innerText =
          "Wähle / Lade bitte zuerst ein Bild hoch!";
        return;
      }

      // Passes the image to AI model
      const results = await classifier.classify(img);

      // Gets probability at the first positon of the results-Array
      const conf = results[0].confidence;
      // Converts probability into percent
      const percent = conf * 100;

      // Shows the label at the first positon of the results-Array and sets it
      resultsLabel.innerText = results[0].label;

      // Determine color (For explanation switch to part 4 'function setup()')
      const color = percent < 50 ? "#f44336" : "#2b9326";

      // If a chart already exists → delete it
      if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
      }

      // Create new Chart (For explanation switch to part 4 'function setup()')
      canvas.chartInstance = new Chart(canvas, {
        type: "doughnut",
        data: {
          labels: ["Confidence", "Rest"],
          datasets: [
            {
              data: [percent, 100 - percent],
              backgroundColor: [color, "#ccc8c8"],
            },
          ],
        },
        options: {
          responsive: false,
          plugins: {
            legend: { display: false },
          },
        },
        plugins: [centerTextPlugin],
      });
    });

  // 5.3 Reset-Button
  document
    // Retrieve HTML element with the ID 'reset' - here <button id="reset">
    .getElementById("reset")
    // Responds to the "click" event when a user clicks the button 'Reset →'
    .addEventListener("click", function () {
      // Retrieves HTML elements which are to be reset
      const img = document.getElementById("preview");
      const resultsLabel = document.getElementById("resultsLabel");
      const errorMessageReset = document.getElementById("errorMessageReset");
      const canvas = document.getElementById("uploadChart");
      const fileInput = document.getElementById("upload");

      // Check if anything is present at all
      const hasImage = img.src && img.src !== window.location.href;
      // Checks: Is there a label?
      const hasLabel = resultsLabel.innerText !== "";
      // Check: Is there a diagram/chart?
      const hasChart = canvas.chartInstance;

      // If everything is empty → nothing to reset
      if (!hasImage && !hasLabel && !hasChart) {
        // Error message + cancellation as a consequence
        errorMessageReset.innerText = "Es gibt nichts zu resetten!";
        return;
      }

      // Reset content
      img.src = "";
      img.style.display = "none";
      resultsLabel.innerText = "";
      fileInput.value = ""; // important so that you can upload the same image again

      // Remove chart and Remove reference
      if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
        canvas.chartInstance = null;
      }

      // Delete error message
      errorMessageReset.innerText = "";
    });
});
