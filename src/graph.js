const NOTCH_COUNT = 8;
const NOTCH_LENGTH = 10;
const LABEL_MARGIN = 5;
const TEXT_SIZE = 16;
const TEXT_FONT = "Arial";

export class Graph {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.data = {
            distribution: null,
            stats: null,
            min: 0,
            max: 0
        };

        this.initializeContext();
    }

    initializeContext() {
        this.ctx.translate(-0.5, 0.5); // fix for blurry lines
        this.ctx.font = `${TEXT_SIZE}px ${TEXT_FONT}`;
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "white";
        this.ctx.strokeStyle = "white";
    }

    get xAxisPos() {
        return this.canvas.height - NOTCH_LENGTH - LABEL_MARGIN - TEXT_SIZE;
    }
    get yAxisPos() {
        return NOTCH_LENGTH / 2;
    }
    get graphWidth() {
        return this.canvas.width - this.yAxisPos;
    }
    get notchPositions() {
        const yAxisPos = this.yAxisPos;
        const spacing = this.graphWidth / NOTCH_COUNT;
        return [...Array(NOTCH_COUNT)].map((_, i) => yAxisPos + (i + 1) * spacing);
    }
    get spacing() {
        return this.graphWidth / (this.data.max - this.data.min);
    }

    updateDimensions() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.initializeContext(); // For some reason, the context is reset as soon as the canvas dimensions change

        if (this.data.distribution !== null) {
            this.invalidate();
        }
    }

    clear() {
        this.ctx.clearRect(0, -1, this.canvas.width + 1, this.canvas.height);
    }

    drawErrorMessage(message) {
        this.clear();

        const fillStyle = this.ctx.fillStyle;

        this.ctx.fillStyle = "red";
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.fillStyle = fillStyle;
    }

    drawGraph(distribution, stats, min, max) {
        this.data.distribution = distribution;
        this.data.stats = stats;
        this.data.min = min;
        this.data.max = max;

        this.invalidate();
    }

    invalidate() {
        this.clear();

        this.ctx.beginPath();
        this.drawAxes();
        this.drawNotches();
        this.drawLabels();
        this.ctx.stroke();

        this.drawVerticalLineForValue(this.data.stats.median, "red");
        for (const sigma of [-3, -2, -1, 1, 2, 3]) {
            const offset = this.data.stats.std * sigma;
            this.drawVerticalLineForValue(this.data.stats.median + offset, "cyan");
        }
        this.drawPlot();
    }

    drawAxes() {
        const xAxisPos = this.xAxisPos;
        const yAxisPos = this.yAxisPos;

        this.ctx.moveTo(yAxisPos, 0);
        this.ctx.lineTo(yAxisPos, xAxisPos + NOTCH_LENGTH);

        this.ctx.moveTo(0, xAxisPos);
        this.ctx.lineTo(this.canvas.width, xAxisPos);
    }

    drawNotches() {
        const xAxisPos = this.xAxisPos;
        for (const x of this.notchPositions) {
            this.ctx.moveTo(x, xAxisPos);
            this.ctx.lineTo(x, xAxisPos + NOTCH_LENGTH);
        }
    }

    drawLabels() {
        const textAlign = this.ctx.textAlign;
        const textBaseline = this.ctx.textBaseline;
        this.ctx.textBaseline = "top";

        const y = this.xAxisPos + NOTCH_LENGTH + LABEL_MARGIN;
        const spacing = (this.data.max - this.data.min) / NOTCH_COUNT;

        this.ctx.textAlign = "left";
        this.ctx.fillText(this.data.min, 0, y);

        this.ctx.textAlign = "center";
        const notches = this.notchPositions;
        for (let i = 0; i < NOTCH_COUNT - 1; i++) {
            const x = notches[i];
            const n = this.data.min + Math.floor(spacing * (i + 1));
            this.ctx.fillText(n, x, y);
        }

        this.ctx.textAlign = "right";
        this.ctx.fillText(this.data.max, this.canvas.width, y);

        this.ctx.textBaseline = textBaseline;
        this.ctx.textAlign = textAlign;
    }

    drawVerticalLineForValue(value, color) {
        const x = this.yAxisPos + (value - this.data.min) * this.spacing;
        if (x < this.yAxisPos || x > this.canvas.width) {
            return;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(x, 0)
        this.ctx.lineTo(x, this.xAxisPos);

        const strokeStyle = this.ctx.strokeStyle;

        this.ctx.strokeStyle = color;
        this.ctx.stroke();

        this.ctx.strokeStyle = strokeStyle;
    }

    drawPlot() {
        const left = this.yAxisPos;
        const bottom = this.xAxisPos;
        const spacing = this.spacing;
        const maxValue = Math.max(...Object.values(this.data.distribution));
        const yScale = bottom / maxValue;

        const getY = value => bottom - yScale * (value || 0);

        this.ctx.beginPath();
        this.ctx.moveTo(left, getY(this.data.distribution[0]));
        for (let i = 1; i < this.data.distribution.length; ++i) {
            const x = left + i * spacing;
            const y = getY(this.data.distribution[i]);
            this.ctx.lineTo(x, y);
        }
        const strokeStyle = this.ctx.strokeStyle;

        this.ctx.strokeStyle = "yellow";
        this.ctx.stroke();

        this.ctx.strokeStyle = strokeStyle;
    }
}
