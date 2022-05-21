const NOTCH_COUNT = 8;
const NOTCH_LENGTH = 10;
const LABEL_MARGIN = 5;
const TEXT_SIZE = 16;

const canvas = document.getElementById("graph");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

const sampleSizeInput = document.getElementById("sample-size");
const minValueInput = document.getElementById("min-value");
const maxValueInput = document.getElementById("max-value");
const codeArea = document.getElementById("code-area");
const medText = document.getElementById("med");
const varText = document.getElementById("var");
const stdText = document.getElementById("std");

const ctx = canvas.getContext("2d");
ctx.translate(-0.5, 0.5); // fix for blurry lines
ctx.font = `${TEXT_SIZE}px Arial`;
ctx.textAlign = "center";
ctx.fillStyle = "white";
ctx.strokeStyle = "white";

const predefinedFunctions = {
    default: "Math.random()",
    normal: "[...Array(6)].map(() => Math.random()).reduce((a, b) => a + b) / 6"
};

const getSampleSize = () => Number(sampleSizeInput.value);
const getFunction = () => codeArea.value;
const getMinValue = () => Number(minValueInput.value);
const getMaxValue = () => Number(maxValueInput.value);
const getNumbers = (f) => [...Array(getSampleSize())].map(() => Number(eval(f)));
const getXAxisPos = () => canvas.height - NOTCH_LENGTH - LABEL_MARGIN - TEXT_SIZE;
const getYAxisPos = () => NOTCH_LENGTH / 2;
const getGraphWidth = () => canvas.width - getYAxisPos();
const getNotchPositions = () => [...Array(NOTCH_COUNT)].map((_, i) => getYAxisPos() + (i + 1) * (getGraphWidth()) / NOTCH_COUNT);
const getDistribution = numbers => {
    const result = {};
    for (let n of numbers) {
        if (result[n]) {
            result[n]++;
        } else {
            result[n] = 1;
        }
    }
    return result;
};
const getStats = numbers => {
    const midpoint = Math.floor(numbers.length / 2);
    const median = numbers.length % 2 ? numbers[midpoint] : (numbers[midpoint - 1] + numbers[midpoint]) / 2;
    const variance = numbers.map(n => (n - median) * (n - median)).reduce((a, b) => a + b) / numbers.length;
    const std = Math.sqrt(variance);

    return {
        median: median,
        variance: variance,
        std: std
    };
};

const changePredefinedFunction = select => {
    codeArea.value = predefinedFunctions[select.value];
    drawGraph();
};

function drawGraph() {
    ctx.clearRect(0, -1, canvas.width + 1, canvas.height);

    let numbers;
    try {
        numbers = getNumbers(getFunction());
    } catch (e) {
        drawErrorMessage(e);
        return;
    }

    if (Number.isNaN(numbers[0])) {
        drawErrorMessage("Function must return valid numbers");
        return;
    }

    numbers.sort((a, b) => a - b);

    if (numbers[0] < 0 || numbers.slice(-1)[0] > 1) {
        drawErrorMessage("Function must return numbers between 0 and 1");
        return;
    }

    const maxValue = getMaxValue();
    const minValue = getMinValue();
    numbers = numbers.map(n => Math.floor((maxValue - minValue) * n + minValue));
    const stats = getStats(numbers);

    ctx.beginPath();
    drawGraphAxes();
    drawGraphNotches();
    drawGraphLabels();
    ctx.stroke();

    drawGraphPlot(numbers, stats);

    updateStats(stats);
}

function drawGraphAxes() {
    const yAxisPos = getYAxisPos();
    ctx.moveTo(yAxisPos, 0);
    ctx.lineTo(yAxisPos, getXAxisPos() + NOTCH_LENGTH);

    const xAxisPos = getXAxisPos();
    ctx.moveTo(0, xAxisPos);
    ctx.lineTo(canvas.width, xAxisPos);
}

function drawGraphNotches(stats) {
    const xAxisPos = getXAxisPos();
    for (let x of getNotchPositions()) {
        ctx.moveTo(x, xAxisPos);
        ctx.lineTo(x, xAxisPos + NOTCH_LENGTH);
    }
}

function drawGraphLabels() {
    const textAlign = ctx.textAlign;
    const textBaseline = ctx.textBaseline;
    ctx.textBaseline = "top";

    const y = getXAxisPos() + NOTCH_LENGTH + LABEL_MARGIN;
    const minValue = getMinValue();
    const maxValue = getMaxValue();
    const spacing = (maxValue - minValue) / NOTCH_COUNT;

    ctx.textAlign = "left";
    ctx.fillText(minValue, 0, y);

    ctx.textAlign = "center";
    const notches = getNotchPositions();
    for (let i = 0; i < NOTCH_COUNT - 1; i++) {
        const x = notches[i];
        const n = minValue + Math.floor(spacing * (i + 1));
        ctx.fillText(n, x, y);
    }

    ctx.textAlign = "right";
    ctx.fillText(maxValue, canvas.width, y);

    ctx.textBaseline = textBaseline;
    ctx.textAlign = textAlign;
}

function drawGraphPlot(numbers, stats) {
    const smallest = getMinValue();
    const largest = getMaxValue();
    const delta = largest - smallest;
    const spacing = getGraphWidth() / delta;
    const distribution = getDistribution(numbers);
    const highestCount = Math.max(...Object.values(distribution));
    const yScale = getXAxisPos() / highestCount;

    const strokeStyle = ctx.strokeStyle;
    // MEDIAN
    ctx.beginPath();
    let x = getYAxisPos() + stats.median * spacing;
    let y = getXAxisPos();
    ctx.moveTo(x, 0)
    ctx.lineTo(x, y);
    ctx.strokeStyle = "red";
    ctx.stroke();

    // STD
    ctx.beginPath();
    for (let i of [-3, -2, -1, 1, 2, 3]) {
        const offset = stats.std * i;
        x = getYAxisPos() + (stats.median + offset) * spacing;
        if (x > getYAxisPos() && x <= canvas.width) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, y);
        }
    }
    ctx.strokeStyle = "cyan";
    ctx.stroke();

    // GRAPH
    ctx.beginPath();
    for (let i = 0; i <= delta; i++) {
        const n = smallest + i;

        x = getYAxisPos() + i * spacing;
        y = getXAxisPos() - yScale * (distribution[n] || 0);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.strokeStyle = "yellow";
    ctx.stroke();
    ctx.strokeStyle = strokeStyle;
}

function drawErrorMessage(errorMessage) {
    const fillStyle = ctx.fillStyle;

    ctx.fillStyle = "red";
    ctx.fillText(errorMessage, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = fillStyle;
}

function updateStats(stats) {
    medText.innerText = stats.median;
    varText.innerText = stats.variance;
    stdText.innerText = stats.std;
}

document.getElementById("btn-submit").addEventListener("click", drawGraph);
document.getElementById("predefined-functions").addEventListener("change", e => changePredefinedFunction(e.target));
changePredefinedFunction(document.getElementById("predefined-functions"));
