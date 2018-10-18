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

import { AudioFactory } from "./audio";
import { Tuner } from "./tuner";

export class Zws {
	constructor() {
		this.audioInput = AudioFactory.getInput(this);
		this.sampleRate = this.audioInput.sampleRate;
		this.audioOutput = AudioFactory.getOutput(this);
		this.tuner = new Tuner(this);
	}

	start() {
		this.audioInput.start();
	}

	stop() {
		this.audioInput.stop();
	}

	receiveAudio(data) {
		//stuff
	}

	receiveFft(data) {
		this.tuner.update(data);
	}

}