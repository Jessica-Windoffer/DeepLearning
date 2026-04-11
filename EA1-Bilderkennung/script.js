// Initialize the Image Classifier method with MobileNet. A callback needs to be passed.
let classifier;

const centerTextPlugin = {
  beforeDraw(chart) {
    const { ctx = document.querySelector(".chart"), width, height } = chart;

    const value = chart.config.data.datasets[0].data[0];

    ctx.save();

    // Styles regarding the text inside the Doghnut Chart can only be set inside JS-file
    // Cannot be styled externally in CSS-file
    ctx.font =
      "bold 15px 'Lucida Sans', 'Lucida Sans Regular', 'Lucida Grande', sans-serif"; // Set font properties
    ctx.fillStyle = "#000000"; // Set color of text to black
    ctx.textAlign = "center"; // Align text to center on vertical line
    ctx.textBaseline = "middle"; // Align text to center on horizontal line

    ctx.fillText((value * 1).toFixed(2) + " %", width / 2, height / 2);

    ctx.restore();
  },
};

async function setup() {
  createCanvas(400, 400);

  classifier = await ml5.imageClassifier("MobileNet");

  const cards = document.querySelectorAll(".card");

  for (let card of cards) {
    const img = card.querySelector(".image");
    const label = card.querySelector(".label");
    const canvas = card.querySelector(".chart");

    const results = await classifier.classify(img);
    const conf = results[0].confidence;
    const percent = (conf * 100).toFixed(2);

    // The results are in an array ordered by confidence
    console.log(results);

    label.innerText = results[0].label;

    if (percent < 50) {
      color = "#f44336";
    } else {
      color = "#2b9326";
    }

    // Create Doughnut Chart
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
          legend: {
            display: false,
          },
        },
      },
      plugins: [centerTextPlugin],
    });
  }
}
