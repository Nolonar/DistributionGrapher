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

const ctx = canvas.getContext("2d");
ctx.translate(-0.5, 0.5); // fix for blurry lines
ctx.font = `${TEXT_SIZE}px Arial`;
ctx.textAlign = "center";
ctx.fillStyle = "white";
ctx.strokeStyle = "white";

const getSampleSize = () => Number(sampleSizeInput.value);
const getFunction = () => codeArea.value;
const getMinValue = () => Number(minValueInput.value);
const getMaxValue = () => Number(maxValueInput.value);
const getNumbers = (f) => [...Array(getSampleSize())].map(() => Number(eval(f)));
const getXAxisPos = () => canvas.height - NOTCH_LENGTH - LABEL_MARGIN - TEXT_SIZE;
const getYAxisPos = () => NOTCH_LENGTH / 2;
const getNotchPositions = () => [...Array(NOTCH_COUNT)].map((_, i) => getYAxisPos() + (i + 1) * (canvas.width - getYAxisPos()) / NOTCH_COUNT);
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
}

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

    ctx.beginPath();
    drawGraphAxes();
    drawGraphNotches();
    drawGraphLabels(numbers);
    ctx.stroke();

    drawGraphPlot(numbers);
}

function drawGraphAxes() {
    const yAxisPos = getYAxisPos();
    ctx.moveTo(yAxisPos, 0);
    ctx.lineTo(yAxisPos, getXAxisPos() + NOTCH_LENGTH);

    const xAxisPos = getXAxisPos();
    ctx.moveTo(0, xAxisPos);
    ctx.lineTo(canvas.width, xAxisPos);
}

function drawGraphNotches() {
    const xAxisPos = getXAxisPos();
    for (let x of getNotchPositions()) {
        ctx.moveTo(x, xAxisPos);
        ctx.lineTo(x, xAxisPos + NOTCH_LENGTH);
    }
}

function drawGraphLabels(numbers) {
    const textAlign = ctx.textAlign;
    const textBaseline = ctx.textBaseline;
    ctx.textBaseline = "top";

    const y = getXAxisPos() + NOTCH_LENGTH + LABEL_MARGIN;

    ctx.textAlign = "left";
    ctx.fillText(getMinValue(), 0, y);

    ctx.textAlign = "center";
    const notches = getNotchPositions();
    const nSpacing = numbers.length / NOTCH_COUNT;
    for (let i = 0; i < NOTCH_COUNT - 1; i++) {
        const x = notches[i];
        const n = numbers[Math.round(nSpacing * (i + 1))];
        ctx.fillText(n, x, y);
    }

    ctx.textAlign = "right";
    ctx.fillText(getMaxValue(), canvas.width, y);

    ctx.textBaseline = textBaseline;
    ctx.textAlign = textAlign;
}

function drawGraphPlot(numbers) {
    const strokeStyle = ctx.strokeStyle;
    ctx.strokeStyle = "yellow";

    const smallest = getMinValue();
    const largest = getMaxValue();
    const spacing = (canvas.width - getYAxisPos()) / (largest - smallest);
    const distribution = getDistribution(numbers);
    const highestCount = Math.max(...Object.values(distribution));
    const yScale = getXAxisPos() / highestCount;

    ctx.beginPath();
    for (let i = smallest; i <= largest; i++) {
        const n = smallest + i;

        const x = getYAxisPos() + i * spacing;
        const y = getXAxisPos() - yScale * (distribution[n] || 0);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    ctx.strokeStyle = strokeStyle;
}

function drawErrorMessage(errorMessage) {
    const fillStyle = ctx.fillStyle;

    ctx.fillStyle = "red";
    ctx.fillText(errorMessage, canvas.width / 2, canvas.height / 2);

    ctx.fillStyle = fillStyle;
}

document.getElementById("btn-submit").addEventListener("click", drawGraph);
drawGraph();
