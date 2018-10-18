/**
 * Jdigi
 *
 * Copyright 2018, Bob Jamison
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU General Public License as published by
 *    the Free Software Foundation, either version 3 of the License, or
 *    (at your option) any later version.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU General Public License for more details.
 *
 *    You should have received a copy of the GNU General Public License
 *    along with this program.  If not, see <http:// www.gnu.org/licenses/>.
 */
/* global window */

import { Constants } from "./constants";

const { BINS } = Constants;

class Draggable {
	/**
	pos0: Point;
	*/

	/**
	 * @param p {Point}
	 */
	constructor(p) {
		this.pos0 = p;
	}

	/**
	 * @param p {Point}
	 */
	drag(p) {}

	/**
	 * @param p {Point}
	 */
	end(p) {}
}


/**
 * Provides a Waterfall display and tuning interactivity
 * @param par the parent Digi of this waterfall
 * @canvas the canvas to use for drawing
 */
export class Tuner {
	/**
	 * @param par parent instance of a Digi api
	 * @param canvas {HTMLCanvasElement}
	 */
	constructor(par) {
		window.requestAnimationFrame = window.requestAnimationFrame
			|| window.msRequestAnimationFrame;
		//  || window.mozRequestAnimationFrame
		//  || window.webkitRequestAnimationFrame;
		this.par = par;
		const canvas = document.getElementById("tuner");
		this.canvas = canvas;
		this.MAX_FREQ = par.sampleRate * 0.5;
		this.draggable = null;
		this.thFrequency = 1000;
		this.indices = null;
		this.width = 100;
		this.height = 100;
		this.ctx = null;
		this.imgData = null;
		this.imglen = null;
		this.buf8 = null;
		this.rowsize = null;
		this.lastRow = null;
		this.scopeData = [];
		this.tuningRate = 1.0;

		this.setupBitmap();

		canvas.setAttribute("tabindex", "1");

		this.palette = this.makePalette();

		this.setupEvents(canvas);
	}

	/**
	 * note that this is different from the public method
	 * @param frequency {number}
	 */
	set frequency(freq) {
		this.theFrequency = freq;
		this.par.frequency = freq;
	}

	/**
	 * @return {number}
	 */
	get frequency() {
		return this.theFrequency;
	}

	/**
	 * @param targetsize {number}
	 * @param sourcesize {number}
	 * @return {number[]}
	 */
	createIndices(targetsize, sourcesize) {
		const xs = new Array(targetsize);
		const ratio = sourcesize / targetsize;
		for (let i = 0; i < targetsize; i++) {
			xs[i] = Math.floor(i * ratio);
		}
		return xs;
	}


	setupBitmap() {
		const { canvas } = this;
		this.width = canvas.width;
		this.height = canvas.height;
		// this.par.status("resize w:" + this.width + "  h:" + this.height);
		this.indices = this.createIndices(this.width, BINS);
		this.ctx = canvas.getContext("2d");
		this.imgData = this.ctx.createImageData(this.width, this.height);
		const { imgData } = this;
		const imglen = this.imglen = imgData.data.length;
		const buf8 = this.buf8 = imgData.data;
		for (let i = 0; i < imglen;) {
			buf8[i++] = 0;
			buf8[i++] = 0;
			buf8[i++] = 0;
			buf8[i++] = 255;
		}
		// imgData.data.set(buf8);
		this.ctx.putImageData(imgData, 0, 0);
		this.rowsize = imglen / this.height;
		this.lastRow = imglen - this.rowsize;
	}

	// ####################################################################
	// #   MOUSE and KEY EVENTS
	// ####################################################################

	setupEvents(canvas) {
		// hate to use "self" here, but it"s a safe way
		const self = this;

		const FINE_INCR = 2;

		function mouseFreq(event) {
			const pt = getMousePos(canvas, event);
			const x = pt.x;
			const freq = self.MAX_FREQ * pt.x / self.width;
			self.frequency = freq;
		}

		function getMousePos(cnv, evt) {
			const touches = evt.touches;
			const cx = (touches) ? touches[0].clientX : evt.clientX;
			const cy = (touches) ? touches[0].clientY : evt.clientY;
			const rect = cnv.getBoundingClientRect();
			const x = (cx - rect.left) * cnv.width / rect.width;
			const y = (cy - rect.top) * cnv.height / rect.height;
			return {
				x,
				y,
			};
		}

		let didDrag = false;

		function onClick(event) {
			if (!didDrag) {
				mouseFreq(event);
			}
			self.draggable = null;
			event.preventDefault();
		}

		function onMouseDown(event) {
			didDrag = false;
			const pos = getMousePos(canvas, event);
			const freq0 = self.frequency;
			const d = new Draggable(pos);
			d.drag = (p) => {
				let dx = p.x - d.pos0.x;
				dx *= self.tuningRate; // cool!
				const freqDiff = self.MAX_FREQ * dx / self.width;
				self.frequency = freq0 + freqDiff;
			};
			self.draggable = d;
			event.preventDefault();
		}

		function onMouseUp(event) {
			if (self.draggable) {
				const pos = getMousePos(canvas, event);
				self.draggable.end(pos);
			}
			self.draggable = null;
			event.preventDefault();
		}

		function onMouseMove(event) {
			const d = self.draggable;
			if (d) {
				didDrag = true;
				const pos = getMousePos(canvas, event);
				d.drag(pos);
			}
			event.preventDefault();
		}

		canvas.onclick = onClick;
		canvas.onmousedown = onMouseDown;
		canvas.onmouseup = onMouseUp;
		canvas.onmousemove = onMouseMove;
		canvas.ontouchstart = onMouseDown;
		canvas.ontouchend = onMouseUp;
		canvas.ontouchmove = onMouseMove;

		// fine tuning, + or - one hertz
		canvas.onkeydown = (evt) => {
			const key = evt.which;
			if (key === 37 || key === 40) {
				self.frequency += 1;
			} else if (key === 38 || key === 39) {
				self.frequency -= 1;
			}
			evt.preventDefault();
			return false;
		};

		function handleWheel(evt) {
			const delta = (evt.detail < 0 || evt.wheelDelta > 0) ? 1 : -1;
			self.frequency += (delta * 1); // or other increments here
			evt.preventDefault();
			return false;
		}

		canvas.onmousewheel = handleWheel;
		canvas.addEventListener("DOMMouseScroll", handleWheel, false);
	}

	// ####################################################################
	// #  R E N D E R I N G
	// ####################################################################

	/**
	 * Make a palette. tweak this often
	 * TODO:  consider using an HSV heat map
	 * @return {number[]}
	 */
	makePalette() {
		const xs = [];
		for (let i = 0; i < 256; i++) {
			const r = (i < 170) ? 0 : (i - 170) * 3;
			const g = (i < 85) ? 0 : (i < 170) ? (i - 85) * 3 : 255;
			const b = (i < 85) ? i * 3 : 255;
			const col = [r, g, b, 255];
			xs[i] = col;
		}
		return xs;
	}

	/**
	 * Alternate palette
	 * @return {number[]}
	 */
	makePalette2() {
		const size = 65536;
		const xs = [];
		const range1 = {
			start: 0,
			end: size / 2,
			r0: 0.0,
			g0: 0.0,
			b0: 0.0,
			r1: 0.0,
			g1: 255,
			b1: 255,
		};
		const range2 = {
			start: size / 2 + 1,
			end: size - 1,
			r0: 0,
			g0: 255,
			b0: 255,
			r1: 255,
			g1: 0,
			b1: 255,
		};
		const ranges = [range1, range2];

		for (let i = 0; i < size; i++) {
			xs[i] = [0, 0, 0];
		}
		ranges.forEach((r) => {
			const d = 1.0 / (r.end - r.start + 1);
			let tween = 0;
			const rr = r.r1 - r.r0;
			const gr = r.g1 - r.g0;
			const br = r.b1 - r.b0;
			for (let i = r.start; i <= r.end; i++) {
				xs[i] = [
					r.r0 + rr * tween,
					r.g0 + gr * tween,
					r.b0 + br * tween,
				];
				tween += d;
			}
		});

		return xs;
	}


	drawSpectrum(data) {
		const width = this.width;
		const height = this.height;
		const ctx = this.ctx;
		const indices = this.indices;

		ctx.lineWidth = 1;
		ctx.beginPath();
		const base = height - 1;
		ctx.moveTo(0, base);
		const log = Math.log;
		for (let x = 0; x < width; x++) {
			const v = data[indices[x]] * 0.25;
			const y = base - v;
			ctx.lineTo(x, y);
		}
		ctx.stroke();
	}


	drawWaterfall(data) {
		const buf8 = this.buf8;
		const rowsize = this.rowsize;
		const imglen = this.imglen;
		const imgData = this.imgData;
		const width = this.width;
		const indices = this.indices;
		const palette = this.palette;

		buf8.set(buf8.subarray(rowsize, imglen)); // <-cool, if this works
		// trace("data:" + data[50]);

		let idx = this.lastRow;
		for (let x = 0; x < width; x++) {
			const v = data[indices[x]];
			const pix = palette[v];
			// if (x==50)trace("p:" + p + "  pix:" + pix.toString(16));
			buf8[idx++] = pix[0];
			buf8[idx++] = pix[1];
			buf8[idx++] = pix[2];
			buf8[idx++] = 255;
		}
		imgData.data.set(buf8);
		this.ctx.putImageData(imgData, 0, 0);
	}

	drawWaterfall2(data) {
		const width = this.width;
		const lastRow = this.lastRow;
		const palette = this.palette;
		const buf8 = this.buf8;
		const rowsize = this.rowsize;
		const imgData = this.imgData;
		const indices = this.indices;
		const imglen = this.imglen;
		const ctx = this.ctx;

		buf8.set(buf8.subarray(rowsize, imglen)); // scroll up one row
		let idx = lastRow;
		const log = Math.log;
		for (let x = 0; x < width; x++) {
			const v = data[indices[x]];
			// if (x==50) trace("v:" + v);
			const p = log(1.0 + v) * 30;
			// if (x==50)trace("x:" + x + " p:" + p);
			const pix = palette[p & 255];
			// if (x==50)trace("p:" + p + "  pix:" + pix.toString(16));
			buf8[idx++] = pix[0];
			buf8[idx++] = pix[1];
			buf8[idx++] = pix[2];
			buf8[idx++] = pix[3];
		}
		imgData.data.set(buf8);
		ctx.putImageData(imgData, 0, 0);
	}


	drawTuner() {
		const MAX_FREQ = this.MAX_FREQ;
		const width = this.width;
		const height = this.height;
		const frequency = this.frequency;
		const ctx = this.ctx;

		const pixPerHz = 1 / MAX_FREQ * width;

		let x = frequency * pixPerHz;
		const bw = this.par.bandwidth;
		const bww = bw * pixPerHz;
		const bwlo = (frequency - bw * 0.5) * pixPerHz;

		ctx.fillStyle = "rgba(255,255,255,0.25)";
		ctx.fillRect(bwlo, 0, bww, height);
		ctx.strokeStyle = "red";
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height);
		ctx.stroke();

		const top = height - 15;

		for (let hz = 0; hz < MAX_FREQ; hz += 100) {
			if ((hz % 1000) === 0) {
				ctx.strokeStyle = "red";
				ctx.beginPath();
				x = hz * pixPerHz;
				ctx.moveTo(x, top);
				ctx.lineTo(x, height);
				ctx.stroke();
			} else {
				ctx.strokeStyle = "white";
				ctx.beginPath();
				x = hz * pixPerHz;
				ctx.moveTo(x, top + 10);
				ctx.lineTo(x, height);
				ctx.stroke();
			}
		}

		ctx.fillStyle = "cyan";
		for (let hz = 0; hz < MAX_FREQ; hz += 500) {
			x = hz * pixPerHz - 10;
			ctx.fillText(hz.toString(), x, top + 14);
		}
	}

	/**
	 * Plot mode-specific decoder graph data.
	 * This method expects the data to be an array of [x,y] coordinates,
	 * with x and y ranging from -1.0 to 1.0.  It is up to the mode generating
	 * this array to determine how to draw it, and what it means.
	 */
	drawScope() {
		const len = this.scopeData.length;
		if (len < 1) {
			return;
		}
		const ctx = this.ctx;
		const boxW = 100;
		const boxH = 100;
		const boxX = this.width - boxW;
		const boxY = 0;
		const centerX = boxX + (boxW >> 1);
		const centerY = boxY + (boxH >> 1);

		ctx.save();
		ctx.beginPath();
		ctx.strokeStyle = "white";
		ctx.rect(boxX, boxY, boxW, boxH);
		ctx.stroke();
		ctx.clip();

		ctx.beginPath();
		ctx.moveTo(centerX, boxY);
		ctx.lineTo(centerX, boxY + boxH);
		ctx.stroke();

		ctx.beginPath();
		ctx.moveTo(boxX, centerY);
		ctx.lineTo(boxX + boxW, centerY);
		ctx.stroke();

		ctx.strokeStyle = "yellow";
		ctx.beginPath();
		let pt = this.scopeData[0];
		let x = centerX + pt[0] * 50.0;
		let y = centerY + pt[1] * 50.0;
		ctx.moveTo(x, y);
		for (let i = 1; i < len; i++) {
			pt = this.scopeData[i];
			x = centerX + pt[0] * 50.0;
			y = centerY + pt[1] * 50.0;
			// console.log("pt:" + x + ":" + y);
			ctx.lineTo(x, y);
		}
		ctx.stroke();

		// all done
		ctx.restore();
	}

	/**
	 * @param data {Uint8Array}
	 */
	updateData(data) {
		this.drawWaterfall(data);
		// this.drawSpectrum(data);
		this.drawTuner();
		this.drawScope();
	}

	showScope(data) {
		this.scopeData = data;
	}

	/**
	 * @param data {Uint8Array}
	 */
	update(data) {
		requestAnimationFrame(() => {
			this.updateData(data);
		});
	}
} // Tuner
