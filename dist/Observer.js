"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _Converter = require('./Converter');

var _Converter2 = _interopRequireDefault(_Converter);

var _ccxt = require('ccxt');

var _ccxt2 = _interopRequireDefault(_ccxt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var redis = require("redis");
let ccxt = new _ccxt2.default.bitmex();
let sleep = ms => {
	return new Promise(resolve => setTimeout(resolve, ms));
};
//import testDB from './test/db.js';
class Observer {
	constructor(candles, frames, optional_frames, history_start, onUpdate) {
		this.candles = candles;
		this.onUpdate = onUpdate;
		(async () => {

			let promises = [];
			for (let localName in frames) {
				let proimse = this._loadHistorical(candles[localName], history_start);
				promises.push(proimse);
			}
			await Promise.all(promises);
			for (let optional in optional_frames) {
				await (0, _Converter2.default)(this.candles, this.candles[optional]);
			}
			for (let frame in candles) {
				this._triggerUpdate(candles[frame]);
			}
			for (let localName in frames) {
				let candle = this.candles[localName];
				let distination = [];
				for (let property in this.candles) {
					if (this.candles[property].baseMs == candle.span) {
						distination.push(this.candles[property]);
					}
				}
				this._polling(candle, history_start, distination);
			}
		})();
	}
	async _polling(candle, history_start, distination) {
		while (true) {
			let since = await this._getLastTime(candle, history_start);
			try {
				await candle.fetch(since, async d => {
					this._triggerUpdate(candle);
					for (let dist of distination) {
						let created = await (0, _Converter2.default)(this.candles, dist);
						if (created) {
							this._triggerUpdate(dist);
						}
					}
				});
			} catch (e) {}
			await sleep(20000);
		}
	}
	async _getLastTime(model, history_start) {
		let since = new Date(history_start).getTime();
		let last = await model.last();
		if (last) {
			since = last.time.getTime() - model.span * 300;
		}
		return since;
	}
	_loadHistorical(model, history_start) {
		return new Promise(async resolve => {
			let since = await this._getLastTime(model, history_start);
			while (true) {
				//				console.log(`getting historical ${model.frame} data from timestamp : ${new Date(since)}`);
				let data = await model.fetch(since);
				if (data.length < 499) {
					console.log(`got all ${model.frame} histories`);
					break;
				}
				since = data[data.length - 1].time.getTime() + model.span;
				await sleep(8000);
			}
			resolve();
		});
	}
	async _triggerUpdate(candle) {
		this._test();
		let data = await candle.last();
		this.onUpdate(candle.frame, JSON.stringify(data));
	}
	async _test() {
		for (let frame in this.candles) {
			let m = this.candles[frame];
			let first = await m.first();
			let last = await m.last();
			if (!first || !last) {
				continue;
			}
			let count = last.time.getTime() - first.time.getTime();
			count /= m.span;
			count++;
			m.count({}, (e, d) => {
				if (d == count) {
					//					console.log(frame,"OK",count)
				} else {
					console.log(frame, "NG", count);
					//					searchLost(m);
				}
			});
		}
	}
}
exports.default = Observer;