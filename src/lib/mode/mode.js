/**
 * Zws
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
/* jslint node: true */

import { Complex } from "../complex";
import { Constants } from "../constants";
import { Biquad } from "../filter";
import { NcoCreateSimple } from "../nco";


export class Afc {
	adjust() {}
	/**
	 * @param ps {number[]}
	 */
	compute(ps) {}
}


/**
 * Base class for all digimodes
 */
export class Mode {

	/**
	 * @param par instance of parent Digi
	 */
	constructor(par) {
		this.par = par;
		this.theFrequency = 1000;
		this.setupAfc();
		this.useAfc = false;
		this.rate = 31.25;
		this.nco = NcoCreateSimple(this.frequency, par.sampleRate);
		this.txNco = NcoCreateSimple(this.frequency, par.sampleRate);
		this.cwBuffer = new Array(1024);
		this.cwBuffer.fill(1.0);
	}

	/**
	 * Override this
	 * @return {Properties}
	 */
	getProperties() {
		return {
			name: "mode",
			description: "Base mode class.  Please override this method",
			tooltip: "Base mode class.  Please override this method",
			controls: []
		};
	}

	/**
	 * @param freq {number}
	 */
	set frequency(freq) {
		this.theFrequency = freq;
		this.nco.setFrequency(freq);
		this.txNco.setFrequency(freq);
		this.afc.adjust();
	}

	/**
	 * @return {number}
	 */
	get frequency() {
		return this.theFrequency;
	}

	/**
	 * @return {number}
	 */
	get bandwidth() {
		return 0;
	}

	setupAfc() {
		let a = new Afc();
		let afcFilter = Biquad.lowPass(1.0, 100.0);
		let loBin, freqBin, hiBin;
		a.adjust = () => {
			let freq = this.frequency;
			let fs = this.par.sampleRate;
			let bw = this.bandwidth;
			let binWidth = fs * 0.5 / Constants.BINS;
			freqBin = Math.round(freq / binWidth);
			loBin = freqBin - 15;
			hiBin = freqBin + 15;
		};
		a.compute = (ps) => {
			let sum = 0;
			let sumScale = 0;
			for (let i = loBin, j = freqBin + 1; i < freqBin; i++, j++) {
				let psi = Math.abs(ps[i]);
				let psj = Math.abs(ps[j]);
				sum += psj - psi;
				sumScale += psj + psi;
			}
			let normalized = sum / sumScale;
			this.par.setFrequency(this.frequency - normalized);
		};
		this.afc = a;
	}

	status(msg) {
		this.par.status(this.getProperties().name + " : " + msg);
	}

	/**
	 * There is a known bug in Typescript that will not allow
	 * calling a super property setter.  The work around is to delegate
	 * the setting to s parent class method, and override that.  This
	 * works in ES6.
	 * @param v {number}
	 */
	setRate(v) {
		this.rate = v;
		this.afc.adjust();
		this.status("Fs: " + this.par.sampleRate + " rate: " + v +
			" sps: " + this.samplesPerSymbol);
	}

	/**
	 * @param v {number}
	 */
	set rate(v) {
		this.setRate(v);
	}

	/**
	 * @return {number}
	 */
	get rate() {
		return this.rate;
	}


	/**
	 * @return {number}
	 */
	get samplesPerSymbol() {
		return this.par.sampleRate / this.rate;
	}


	// #######################
	// # R E C E I V E
	// #######################

	/**
	 * @param ps {number[]}
	 */
	receiveFft(ps) {
		if (this.useAfc) {
			this.afc.compute(ps);
		}
	}

	/**
	 * @param ps {number[]}
	 */
	receiveData(data) {
		let len = data.length;
		for (let i = 0; i < len; i++) {
			let v = data[i];
			let cs = this.nco.next();
			this.receive({
				r: v * cs.r,
				i: v * cs.i
			});
		}
	}

	/**
	 * Overload this for each mode.
	 * @param v {Complex}
	 */
	receive(v) {}

	// #######################
	// # T R A N S M I T
	// #######################

	trannmitClear() {		
		this.trasmitData = [];
		this.cursor = 0;
	}

	sendText(text) {
		const bytes = [];
		for (let i = 0, len = text.length ; i < len ; i++) {
			bytes[i] = text.charCodeAt(i);
		}
		this.sendBytes(bytes);

	}

	sendBytes(bytes) {
		this.trasmitData = this.transmitData.concat(bytes);
	}

	getTransmitData(amount) {
		const cursor = this.cursor;
		const data = this.transmitData || [];
		const len = data.length;
		if (cursor >= len) {
			this.trasmitClear();
			return null;
		}
		const end = Math.min(len, cursor + amount);
		const chunk = data.slice(cursor, end);
		this.cursor = end;
		return chunk;
	}

	/**
	 * @Override this for each mode.  As long as data is available,
	 * transmit.  If none and the mode has an idle signal, transmit
	 * that.  Else return null.
	 * @return {number[]}
	 */
	transmit() {
		return null;
	} 

	transmitSignal() {
		const baseBand = this.transmit();
		if (!baseband) {
			return null;
		}
		const xs = this.txNco.mixBuf(baseBand);
		return xs;
	}

}