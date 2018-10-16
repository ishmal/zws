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

import {Digi} from "../zws";
import {Complex} from "../complex";
import {Nco, NcoCreate, NcoCreateSimple} from "../nco";
import {Constants} from "../constants";
import {Filter, Biquad} from "../filter";

/*
export interface Control {
    name: string;
    type: string;
    tooltip?: string;
    value: any;
    options?: Object;
}

export interface Properties {
    name: string;
    description: string;
    tooltip: string;
    controls: Control[];
}
*/

export class Afc {
    adjust() {
    }
    /**
     * @param ps {number[]}
     */
    compute(ps) {
    }
}


/**
 * Base class for all digimodes
 */
export class Mode {

    /**
    par: Digi;
    _frequency: number;
    _afcFilter: Filter;
    _loBin: number;
    _freqBin: number;
    _hiBin: number;
    _afc: Afc;
    _useAfc: boolean;
    _rate: number;
    _nco: Nco;
    _txNco: Nco;
    _obuf: Float32Array;
    _optr: number;
    _ibuf: number[];
    _ilen: number;
    _iptr: number;
    _cwBuffer: number[];
    */

    /**
     * @param par instance of parent Digi
     */
    constructor(par) {
        this.par = par;
        this._frequency = 1000;
        this.setupAfc();
        this.useAfc = false;
        this._rate = 31.25;
        this._nco = NcoCreateSimple(this._frequency, par.sampleRate);
        this._txNco = NcoCreateSimple(this._frequency, par.sampleRate);
        this._cwBuffer = new Array(1024);
        this._cwBuffer.fill(1.0);
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
        this._frequency = freq;
        this._nco.setFrequency(freq);
        this._txNco.setFrequency(freq);
        this._afc.adjust();
    }

    /**
     * @return {number}
     */
    get frequency() {
        return this._frequency;
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
            let freq = this._frequency;
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
        this._afc = a;
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
    _setRate(v) {
        this._rate = v;
        this._afc.adjust();
        this.status("Fs: " + this.par.sampleRate + " rate: " + v +
            " sps: " + this.samplesPerSymbol);
    }

    /**
     * @param v {number}
     */
    set rate(v) {
        this._setRate(v);
    }

    /**
     * @return {number}
     */
    get rate() {
        return this._rate;
    }


    /**
     * @return {number}
     */
    get samplesPerSymbol() {
        return this.par.sampleRate / this._rate;
    }


    // #######################
    // # R E C E I V E
    // #######################

    /**
     * @param ps {number[]}
     */
    receiveFft(ps) {
        if (this._useAfc) {
            this._afc.compute(ps);
        }
    }

    /**
     * @param ps {number[]}
     */
    receiveData(data) {
        let len = data.length;
        for (let i=0 ; i < len ; i++) {
          let v = data[i];
          let cs = this._nco.next();
          this.receive({ r: v * cs.r, i: v * cs.i });
        }
    }

    /**
     * Overload this for each mode.
     * @param v {Complex}
     */
    receive(v) {
    }

    // #######################
    // # T R A N S M I T
    // #######################

    /**
     * @return {boolean}
     */
    txStart() {
      return true;
    }

    /**
     * @return {boolean}
     */
    txStop() {
      return true;
    }

    /**
     * @return {number[]}
     */
    getTransmitData() {
        let abs = Math.hypot;
        let baseBand = this.getBasebandData();
        let xs = this._txNco.mixBuf(baseBand);
        return xs;
    }

    /**
     * Override this for each mode
     * Retrieve a buffer of baseband-modlated data
     * (or idle tones) from each band
     * @return {number[]}
     */
    getBasebandData() {
      return this._cwBuffer; //default to cw tone
    }

}
