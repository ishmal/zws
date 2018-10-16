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
 *    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * A few Window types
 */
export class Window {
    /**
     * @param size number
     * @return number[]
     */
    static rectangle(size) {
        const xs = new Array(size);
        for (let i = 0; i < size; i++) {
            xs[i] = 1.0;
        }
        return xs;
    }

    /**
     * @param size number
     * @return number[]
     */
    static bartlett(size) {
        const xs = new Array(size);
        for (let i = 0; i < size; i++) {
            xs[i] = 2 / (size - 1) * ((size - 1) / 2 - Math.abs(i - (size - 1) / 2));
        }
        return xs;
    }

    /**
     * @param size number
     * @return number[]
     */
    static blackman(size) {
        const alpha = 0.16; // the "exact" Blackman
        const a0 = (1 - alpha) / 2;
        const a1 = 0.5;
        const a2 = alpha * 0.5;
        const xs = new Array(size);
        for (let i = 0; i < size; i++) {
			xs[i] = a0 - a1 * Math.cos(2.0 * Math.PI * i / (size - 1))
				+ a2 * Math.cos(4 * Math.PI * i / (size - 1));
        }
        return xs;
    }

    /**
     * @param size number
     * @return number[]
     */
    static cosine(size) {
        const xs = new Array(size);
        for (let i = 0; i < size; i++) {
            xs[i] = Math.cos(Math.PI * i / (size - 1) - Math.PI / 2);
        }
        return xs;
    }

    /**
     * @param size number
     * @return number[]
     */
    static gauss(size) {
        const xs = new Array(size);
        const alpha = 1.0;
        for (let i = 0; i < size; i++) {
			xs[i] = Math.exp(-0.5 * (((i - (size - 1) / 2) / (alpha * (size - 1) / 2)) ** 2));
        }
        return xs;
    }

    /**
     * @param size number
     * @return number[]
     */
    static hamming(size) {
        const xs = new Array(size);
        for (let i = 0; i < size; i++) {
            xs[i] = 0.54 - 0.46 * Math.cos(2.0 * Math.PI * i / (size - 1));
        }
        return xs;
    }

    /**
     * @param size number
     * @return number[]
     */
    static hann(size) {
        const xs = new Array(size);
        for (let i = 0; i < size; i++) {
            xs[i] = 0.5 - 0.5 * Math.cos(2.0 * Math.PI * i / (size - 1));
        }
        return xs;
    }
}
