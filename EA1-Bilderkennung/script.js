// Initialize the Image Classifier method with MobileNet. A callback needs to be passed.
let classifier;

const imageSources = [
  "./bildDateien/cat.jpg",
  "./bildDateien/banana.jpeg",
  "./bildDateien/castle.jpeg",
  "./bildDateien/trees.jpg",
  "./bildDateien/fruits.jpg",
  "./bildDateien/flower-field.jpg",
];

const resultsArray = [];

function createCard(imgSrc, labelText, percent, color) {
  const template = document.getElementById("cardTemplate");
  const clone = template.content.cloneNode(true);

  const card = clone.querySelector(".card");
  const img = clone.querySelector(".image");
  const label = clone.querySelector(".label");

  img.src = imgSrc;
  label.innerText = labelText;

  return card;
}

const centerTextPlugin = {
  beforeDraw(chart) {
    const { ctx = document.querySelector(".chart"), width, height } = chart;

    const value = chart.config.data.datasets[0].data[0];

    ctx.save();

    // Styles regarding the text inside the Doghnut Chart can only be set inside JS-file
    // Cannot be styled externally in CSS-file
    ctx.font =
      "bold 14px 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', sans-serif"; // Set font properties
    ctx.fillStyle = "#000000"; // Set color of text to black
    ctx.textAlign = "center"; // Align text to center on vertical line
    ctx.textBaseline = "middle"; // Align text to center on horizontal line

    ctx.fillText((value * 1).toFixed(2) + " %", width / 2, height / 2);

    ctx.restore();
  },
};

async function setup() {
  createCanvas(400, 400);

  const loaderCorrect = document.getElementById("loaderCorrect");
  const loaderWrong = document.getElementById("loaderWrong");

  loaderCorrect.classList.remove("hidden");
  loaderWrong.classList.remove("hidden");

  classifier = await ml5.imageClassifier("MobileNet");

  const korrektContainer = document.querySelector(".korrektKlassifiziert");
  const falschContainer = document.querySelector(".falschKlassifiziert");

  const resultsArray = [];

  // 🔹 1. Alle Bilder klassifizieren und speichern
  for (let src of imageSources) {
    const img = new Image();
    img.src = src;

    await new Promise((resolve) => (img.onload = resolve));

    const results = await classifier.classify(img);

    const label = results[0].label;
    const confidence = results[0].confidence;

    resultsArray.push({
      src,
      label,
      confidence,
    });
  }

  // 🔹 2. Sortieren (höchste Confidence zuerst)
  resultsArray.sort((a, b) => b.confidence - a.confidence);

  // 🔹 3. Rendern
  for (let item of resultsArray) {
    const percent = item.confidence * 100;
    const color = percent < 50 ? "#f44336" : "#2b9326";

    const card = createCard(item.src, item.label, percent.toFixed(2), color);

    if (percent >= 50) {
      korrektContainer.appendChild(card);
    } else {
      falschContainer.appendChild(card);
    }

    const canvas = card.querySelector(".chart");

    new Chart(canvas, {
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
  }

  // Loader ausblenden
  loaderCorrect.classList.add("hidden");
  loaderWrong.classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", async function () {
  classifier = await ml5.imageClassifier("MobileNet");

  document
    .getElementById("upload")
    .addEventListener("change", function (event) {
      const file = event.target.files[0];

      if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
          const img = document.getElementById("preview");
          img.src = e.target.result;
          img.style.display = "block";
        };

        reader.readAsDataURL(file);
      }
    });

  document
    .getElementById("classify")
    .addEventListener("click", async function () {
      const img = document.getElementById("preview");
      const resultsLabel = document.getElementById("resultsLabel");
      const errorMessageClassify = document.getElementById(
        "errorMessageClassify",
      );
      const canvas = document.getElementById("uploadChart");

      errorMessageClassify.innerText = "";

      // Check if picture has been selected
      if (!img.src || img.src === window.location.href) {
        errorMessageClassify.innerText =
          "Wähle / Lade bitte zuerst ein Bild hoch!";
        return;
      }

      const results = await classifier.classify(img);

      const conf = results[0].confidence;
      const percent = conf * 100;

      console.log(results);

      resultsLabel.innerText = results[0].label;
      // Farbe bestimmen
      const color = percent < 50 ? "#f44336" : "#2b9326";

      // Falls Chart schon existiert → löschen (wichtig!)
      if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
      }

      // neuen Chart erstellen
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

  document.getElementById("reset").addEventListener("click", function () {
    const img = document.getElementById("preview");
    const resultsLabel = document.getElementById("resultsLabel");
    const errorMessageReset = document.getElementById("errorMessageReset");
    const canvas = document.getElementById("uploadChart");
    const fileInput = document.getElementById("upload");

    // Prüfen, ob überhaupt etwas vorhanden ist
    const hasImage = img.src && img.src !== window.location.href;
    const hasLabel = resultsLabel.innerText !== "";
    const hasChart = canvas.chartInstance;

    if (!hasImage && !hasLabel && !hasChart) {
      errorMessageReset.innerText = "Es gibt nichts zu resetten!";
      return;
    }

    // Inhalte zurücksetzen
    img.src = "";
    img.style.display = "none";

    resultsLabel.innerText = "";

    fileInput.value = ""; // wichtig, damit man dasselbe Bild nochmal hochladen kann

    // Chart entfernen
    if (canvas.chartInstance) {
      canvas.chartInstance.destroy();
      canvas.chartInstance = null;
    }

    errorMessageReset.innerText = "";
  });
});
