/**
 * Audio
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
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global window, navigator, AudioContext */
/* eslint-env node */

import {
	Constants
} from "./constants";

//######################################################################
// A U D I O    I N P U T
//######################################################################

/**
 * Base class for any audio input devices
 */
export class AudioInput {

	/**
	 * @param par the parent Digi instance
	 */
	constructor(par) {
		this.par = par;
		this.sampleRate = 8000;
		this.enabled = true;
	}

	/**
	 * @param data number[]
	 */
	receive(data) {
		this.par.receiveAudio(data);
	}

	/**
	 * @return Uint8Array
	 */
	getFftData() {
		return new Uint8Array(0);
	}

	/**
	 * Called to connect with the device and start processing.
	 * @return boolean
	 */
	open() {
		return true;
	}

	/**
	 * Called to disconnect from input device and cease operations
	 * @return boolean
	 */
	close() {
		return true;
	}

	/**
	 * Called to resume input processing
	 * @return boolean
	 */
	start() {
		return true;
	}

	/**
	 * Called to pause input processing
	 * @return boolean
	 */
	stop() {
		return true;
	}

}

//######################################################################
// A U D I O    O U T P U T
//######################################################################

/**
 * Base clase for any audio output devices.
 */
export class AudioOutput {

	/**
	 * @param par the parent Digi instance
	 */
	constructor(par) {
		this.par = par;
		this.sampleRate = 8000;
		this.enabled = true;
	}

	/**
	 * @return {number[]}
	 */
	transmit() {
		return this.par.transmit();
	}

	/**
	 * Called to connect with the device and start processing.
	 * @return {boolean}
	 */
	open() {
		return true;
	}

	/**
	 * Called to disconnect from input device and cease operations
	 * @return {boolean}
	 */
	close() {
		return true;
	}

	/**
	 * Called to resume output processing
	 * @return {boolean}
	 */
	start() {
		return true;
	}

	/**
	 * Called to pause output processing
	 * @return {boolean}
	 */
	stop() {
		return true;
	}

}

//######################################################################
//# W E B    A U D I O    I N P U T
//######################################################################

navigator.getUserMedia =
	navigator.getUserMedia ||
	navigator.webkitGetUserMedia ||
	navigator.mozGetUserMedia;

/**
 * WebAudio implementation of AudioInput
 */
export class WebAudioInput extends AudioInput {

	/**
	 * @param par the parent Digi instance
	 */
	constructor(par) {
		super(par);
		this.par = par;
		this.actx = new AudioContext();
		this.decimation = 8;
		this.sampleRate = this.actx.sampleRate / this.decimation;
		this.source = null;
		this.stream = null;
		this.inputNode = null;
		this.isRunning = false;
		this.analyser = { // dummy until audio started
			getByteFrequencyData: function (d) {}
		};
	}

	/**
	 * @return Uint8Array
	 */
	getFftData() {
		const dataArray = new Uint8Array(Constants.BINS);
		this.analyser.getByteFrequencyData(dataArray);
		return dataArray;
	}

	setupSource() {
		let outBufSize = 1024;
		let outPtr = 0;
		let outCtr = 0;
		let outBuf = [];
		let bufferSize = 8192;
		//let decimator = Resampler.create(this.decimation);
		this.inputNode = this.actx.createScriptProcessor(bufferSize, 1, 1);
		this.inputNode.onaudioprocess = (e) => {
			if (!this.isRunning) {
				return;
			}
			let input = e.inputBuffer.getChannelData(0);
			let len = input.length;
			//let d = decimator;
			for (let i = 0; i < len; i++) {
				outCtr++;
				if (outCtr >= 8) {
					outBuf[outPtr++] = input[i];
					outCtr = 0;
					if (outPtr >= outBufSize) {
						this.receive(outBuf);
						outBuf = [];
						outPtr = 0;
					}
				}
			}
		};

		this.analyser = this.actx.createAnalyser();
		this.analyser.fftSize = Constants.FFT_SIZE * this.decimation;
		this.source.connect(this.analyser);
		this.analyser.connect(this.inputNode);
		this.inputNode.connect(this.actx.destination);
		this.isRunning = true;
	}

	/**
	 * @param newstream {MediaStream}
	 */
	startStream(newstream) {
		this.stream = newstream;
		this.source = this.actx.createMediaStreamSource(newstream);
		this.setupSource();
	}

	/**
	 * @return boolean
	 */
	start() {
		if (navigator.getUserMedia) {
			navigator.getUserMedia({
					audio: true
				},
				stream => {
					this.startStream(stream);
				},
				userMediaError => {
					this.par.error(userMediaError.name + " : " + userMediaError.message);
				}
			);
		} else if (navigator.mediaDevices.getUserMedia) {
			navigator.mediaDevices.getUserMedia({
					audio: true
				})
				.then(stream => this.startStream(stream))
				.catch(err => {
					console.log("audioInput: " + err);
				});
		}
		return true;
	}

	/**
	 * @return boolean
	 */
	stop() {
		this.isRunning = false;
		if (this.inputNode) {
			this.inputNode.disconnect();
		}
		return true;
	}


}

//######################################################################
// C O R D O V A    A U D I O    I N P U T
//######################################################################

export class CordovaAudioInput extends AudioInput {

	/**
	 * @param par instance of parent Digi
	 */
	constructor(par) {
		super(par);
		this.par = par;
		this.sampleRate = 8000;
		this.audioInput = null;
		this.isRunning = false;
		let that = this;
		window.addEventListener("audioinput", function (evt) {
			that.receive(evt.data);
		}, false);
		window.addEventListener("audioinputerror", function (error) {
			console.log("onAudioInputError event recieved: " + JSON.stringify(error));
		}, false);
	}

	open() {
		//try cordova plugin first
		let audioInput = window.audioinput;
		if (!audioInput) {
			return;
		}
		try {
			this.audioInput = audioInput;
			if (!audioInput.isCapturing()) {
				audioInput.start({
					sampleRate: audioInput.SAMPLERATE.TELEPHONE_8000Hz
				});
				this.isRunning = true;
			}
			return true;
		} catch (ex) {
			console.log("open: " + ex);
			return false;
		}
	}

	close() {
		this.isRunning = false;
		this.audioInput.stop();
		return true;
	}

	start() {
		this.isRunning = true;
		return true;
	}

	stop() {
		this.isRunning = false;
		return true;
	}


}


//######################################################################
// W E B    A U D I O    O U T P U T
//######################################################################



/**
 * Getting this to work with interpolation isn"t easy
 */
export class WebAudioOutput extends AudioOutput {

	/**
	 * @param par instance of parent Digi
	 */
	constructor(par) {
		super(par);
		this.actx = new AudioContext();
		this.sampleRate = this.actx.sampleRate;
		this.isRunning = false;
		this.enabled = false;
	}

	open() {

		let that = this;
		let bufferSize = 4096;
		let decimation = 8;
		let iptr = 0;
		let ibuf = [];
		let ilen = 0;
		let outPtr = 0;
		this.source = this.actx.createScriptProcessor(bufferSize, 0, 1);
		this.source.onaudioprocess = (e) => {
			let outBuf = e.outputBuffer.getChannelData(0);
			let len = outBuf.length;
			outBuf.fill(0);
			if (!that.isRunning) {
				return;
			}
			while (outPtr < len) {
				if (iptr >= ilen) {
					ibuf = this.par.transmit();
					ilen = ibuf.length;
					iptr = 0;
				}
				outBuf[outPtr] = ibuf[iptr++];
				outPtr += decimation;
			}
			outPtr -= len;
		};

		//this.outputNode.connect(this.actx.destination);

		let lpf = this.actx.createBiquadFilter();
		lpf.type = "lowpass";
		lpf.frequency.value = 3000.0;
		lpf.gain.value = 5;
		lpf.Q.value = 20;
		this.source.connect(lpf);

		this.isRunning = false; //by default
		return true;
	}


	close() {
		this.isRunning = false;
		if (this.source) {
			this.source.disconnect();
		}
		return true;
	}


	start() {
		this.isRunning = true;
		return true;
	}

	stop() {
		this.isRunning = false;
		return true;
	}

}


/**
 * Factory for creating Audio apis
 */
export class AudioFactory {

	/**
	 * @param par instance of parent Digi
	 * @return {AudioInput}
	 */
	static getInput(par) {
		return new WebAudioInput(par);
	}

	/**
	 * @param par instance of parent Digi
	 * @return {AudioOutput}
	 */
	static getOutput(par) {
		return new WebAudioOutput(par);
	}

}