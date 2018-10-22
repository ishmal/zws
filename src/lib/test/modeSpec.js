

export class ModeTester {
	constructor(ModeClass) {
		this.sampleRate = 8000.0;
		this.mode = new ModeClass(this);
		this.prepareInputData("quick brown fox");
	}

	prepareInputData(text) {
		this.data = [];
		this.cursor = 0;
		for (let i = 0, len = text.length; i < len ; i++) {
			this.data[i] = text.charCodeAt(i);
		}
	}

	getInputData(amount) {
		const len = this.data.length;
		if (this.cursor >= len) {
			return null;
		}
		const end = Math.min(len, this.cursor + amount)
		const data = this.data.slice(this.cursor, end);
		this.curson = end;
		return data;
	}

	test() {
		const mode = this.mode;
		let outbuf = [];
		while(true) {
			const data = mode.transmit();
			const outBytes = mode.receive(data);
			outBuf = outBuf.concat(outBytes);
			if (!data) {
				break;
			}
		}
	}
}