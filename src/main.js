import { Graph } from "./graph.js";

const graph = new Graph(document.getElementById("graph"));

const maxSampleSizeInput = document.getElementById("max-sample-size");
const minValueInput = document.getElementById("min-value");
const maxValueInput = document.getElementById("max-value");
const codeArea = document.getElementById("code-area");
const samplesText = document.getElementById("samples");
const medText = document.getElementById("med");
const varText = document.getElementById("var");
const stdText = document.getElementById("std");

const TARGET_FRAMERATE = 1000 / 60;

const predefinedFunctions = {
    default: "Math.random()",
    normal: "[...Array(6)].map(() => Math.random()).reduce((a, b) => a + b) / 6"
};

const getMaxSampleSize = () => Number(maxSampleSizeInput.value);
const getFunction = () => codeArea.value;
const getMinValue = () => Number(minValueInput.value);
const getMaxValue = () => Number(maxValueInput.value);
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
const isNumbersArrayFull = () => numbers.length >= maxSampleSize;

let maxSampleSize = 0;
let rngFunction = "";
let numbers = [0];
let animationFrameRequestId = null;

function changePredefinedFunction(select) {
    codeArea.value = predefinedFunctions[select.value];
    submitFunction();
};

function submitFunction() {
    maxSampleSize = getMaxSampleSize();
    rngFunction = getFunction();
    numbers = [];
    if (animationFrameRequestId !== null)
        cancelAnimationFrame(animationFrameRequestId);

    animationFrameRequestId = requestAnimationFrame(update);
}

function update() {
    if (isNumbersArrayFull())
        return;

    if (!updateNumbers())
        return;

    updateGraph();
    animationFrameRequestId = requestAnimationFrame(update);
}

function updateNumbers() {
    const startTime = performance.now();
    while (performance.now() - startTime < TARGET_FRAMERATE && !isNumbersArrayFull()) {
        let number = 0;
        try {
            number = Number(eval(rngFunction));
        } catch (e) {
            graph.drawErrorMessage(e);
            return false;
        }
        if (Number.isNaN(number)) {
            graph.drawErrorMessage("Function must return valid numbers");
            return false;
        }
        if (number < 0 || number > 1) {
            graph.drawErrorMessage("Function must return numbers between 0 and 1");
            return false;
        }

        numbers.push(number);
    }
    return true;
}

function updateGraph() {
    const minValue = getMinValue();
    const maxValue = getMaxValue();

    const data = numbers.sort((a, b) => a - b).map(n => Math.floor((maxValue - minValue) * n + minValue));
    const stats = getStats(data);
    const distribution = getDistribution(data, minValue, maxValue);

    graph.drawGraph(distribution, stats, minValue, maxValue);
    updateStats(stats);
}

function updateStats(stats) {
    samplesText.innerText = `${numbers.length} (${Math.floor(numbers.length / maxSampleSize * 100)}%)`;
    medText.innerText = stats.median;
    varText.innerText = stats.variance;
    stdText.innerText = stats.std;
}

function getDistribution(numbers, minValue, maxValue) {
    const result = new Array(maxValue - minValue).fill(0);
    for (const n of numbers.map(n => n - minValue))
        ++result[n];

    return result;
}

window.addEventListener("resize", graph.updateDimensions);
document.getElementById("btn-submit").addEventListener("click", submitFunction);
document.getElementById("predefined-functions").addEventListener("change", e => changePredefinedFunction(e.target));

graph.updateDimensions();
changePredefinedFunction(document.getElementById("predefined-functions"));
