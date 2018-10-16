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
export interface Complex {
    r: number;
    i: number;
}
*/

export const ZERO = { r: 0, i: 0 };
export const ONE = { r: 1, i: 0 };
export const I = { r: 0, i: 1 };

/**
 *
 */
export class ComplexOps {

    /**
     * @param a {Complex}
     * @param b {Complex}
     * @return {Complex}
     */
    static add(a, b) {
        return { r: a.r + b.r, i: a.i + b.i };
    }

    /**
     * @param a {Complex}
     * @param b {Complex}
     * @return {Complex}
     */
    static sub(a, b) {
        return { r: a.r - b.r, i: a.i - b.i };
    }

    /**
     * @param a {Complex}
     * @param n {number}
     * @return {Complex}
     */
    static scale(a, v) {
        return { r: a.r * v, i: a.i * v };
    }

    /**
     * @param a {Complex}
     * @param b {Complex}
     * @return {Complex}
     */
    static mul(a, b) {
        let ar = a.r;
        let ai = a.i;
        let br = b.r;
        let bi = b.i;
        return { r: ar * br - ai * bi, i: ar * bi + ai * br };
    }

    /**
     * @param a {Complex}
     * @return {Complex}
     */
    static neg(a) {
        return { r: -a.r, i: -a.i };
    }

    /**
     * @param a {Complex}
     * @return {Complex}
     */
    static conj(a) {
        return { r: a.r, i: -a.i };
    }

    /**
     * @param a {Complex}
     * @return {number}
     */
    static mag(a) {
        let r = a.r;
        let i = a.i;
        return r * r + i * i;
    }

    /**
     * @param a {Complex}
     * @return {number}
     */
    static abs(a) {
        return Math.hypot(a.r, a.i);
    }

    /**
     * @param a {Complex}
     * @return {number}
     */
    static arg(a) {
        return Math.atan2(a.i, a.r);
    }

}
