"use strict";
import Converter from './Converter';
import Ccxt from 'ccxt';
let ccxt = new Ccxt.bitmex();
let sleep = (ms) => {
	return new Promise(resolve => setTimeout(resolve, ms));
}
//import testDB from './test/db.js';
export default class Observer{
	constructor(
			candles,
			frames,
			optional_frames,
			history_start) {
		this.onUpdate = {};
		this.candles = candles;
		this.converter = new Converter();
		let self = this;
		(async () => {
			for(let localName in frames){
				await self._loadHistorical(
						candles[localName],
						history_start)
			}
			this._polling(frames,history_start);
		})();
	}
	async _polling(frames,history_start){
		while(true){
			for(let localName in frames){
				let model = this.candles[localName];
				let since = await this._getLastTime(model,history_start);
				let data = await model.fetch(since,() => {
					this._triggerUpdate(model.frame);
				});
//				clog(data[data.length - 1]);
			}
			await sleep(20000);
		}
	}
	_on(frame,next){
		this.onUpdate[frame] = next;
	}
	async _getLastTime(model,history_start){
		let since = new Date(history_start).getTime();
		let last = await model.last();
		if(last){
			since = last.time.getTime() - model.span*300;
		}
		return since;
	}
	async _loadHistorical(model,history_start){
		let since = await this._getLastTime(model,history_start);
		while(true){
			clog(`getting historical ${model.frame} data from timestamp : ${new Date(since)}`);
			let data = await model.fetch(since);
			if(data.length < 499){
				clog(`got all ${model.frame} histories`)
				break;
			}
			since = data[data.length - 1].time.getTime() + model.span;
			await sleep(2000);
		}
	}
	async _triggerUpdate(frame,data){
//		if(this.converter.working){
//			return;
//		}
//		await this.converter.execute();
		/*await this._test();*/
		if(this.onUpdate[frame]){
			let data = await this.candles[frame].last();
			this.onUpdate[frame](data);
		}
	}
	async _test(){
		for(let frame in this.candles){
			let m = this.candles[frame];
			let first = await m.first();
			let last = await m.last();
			if(!first || !last){
				continue;
			}
			let count = last.time.getTime() - first.time.getTime();
			count /= m.span;
			count++;
			m.count({},(e,d)=>{
				if(d == count){
//					clog(frame,"OK",count)
				}else{
					clog(frame,"NG",count)
//					searchLost(m);
				}
			})
		}
	}
}
