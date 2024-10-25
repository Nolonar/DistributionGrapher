import { Graph } from "./graph.js";

const graph = new Graph(document.getElementById("graph"));

const sampleSizeInput = document.getElementById("sample-size");
const minValueInput = document.getElementById("min-value");
const maxValueInput = document.getElementById("max-value");
const codeArea = document.getElementById("code-area");
const medText = document.getElementById("med");
const varText = document.getElementById("var");
const stdText = document.getElementById("std");

const predefinedFunctions = {
    default: "Math.random()",
    normal: "[...Array(6)].map(() => Math.random()).reduce((a, b) => a + b) / 6"
};

const getSampleSize = () => Number(sampleSizeInput.value);
const getFunction = () => codeArea.value;
const getMinValue = () => Number(minValueInput.value);
const getMaxValue = () => Number(maxValueInput.value);
const getNumbers = (f) => [...Array(getSampleSize())].map(() => Number(eval(f)));
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

function changePredefinedFunction(select) {
    codeArea.value = predefinedFunctions[select.value];
    submitFunction();
};

function submitFunction() {
    let numbers;
    try {
        numbers = getNumbers(getFunction());
    } catch (e) {
        graph.drawErrorMessage(e);
        return;
    }

    if (Number.isNaN(numbers[0])) {
        graph.drawErrorMessage("Function must return valid numbers");
        return;
    }

    numbers.sort((a, b) => a - b);

    if (numbers[0] < 0 || numbers.slice(-1)[0] > 1) {
        graph.drawErrorMessage("Function must return numbers between 0 and 1");
        return;
    }

    const minValue = getMinValue();
    const maxValue = getMaxValue();
    numbers = numbers.map(n => Math.floor((maxValue - minValue) * n + minValue));
    const stats = getStats(numbers);

    graph.drawGraph(numbers, stats, minValue, maxValue);
    updateStats(stats);
}

function updateStats(stats) {
    medText.innerText = stats.median;
    varText.innerText = stats.variance;
    stdText.innerText = stats.std;
}

window.addEventListener("resize", graph.updateDimensions);
document.getElementById("btn-submit").addEventListener("click", submitFunction);
document.getElementById("predefined-functions").addEventListener("change", e => changePredefinedFunction(e.target));

graph.updateDimensions();
changePredefinedFunction(document.getElementById("predefined-functions"));
