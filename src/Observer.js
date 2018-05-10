"use strict";
import BitMEXClient from 'bitmex-realtime-api';
import Converter from './Converter';
import Ccxt from 'ccxt';
let ccxt = new Ccxt.bitmex({
});
let sleep = (ms) => {
	return new Promise(resolve => setTimeout(resolve, ms));
}
//import testDB from './test/db.js';
let bitmexNames = {
	"m1" : "1m",
	"m5" : "5m",
	"h1" : "1h",
	"d1" : "1d",
}
export default class Observer{
	constructor(
			candles,
			frames,
			optional_frames,
			history_start) {
		this.onUpdate = {};
		this.socket = new BitMEXClient({
			testnet: false,
		});
		this.candles = candles;
		this.converter = new Converter();
		this.socketLoaded = false;
		this.restLoaded = false;
		let self = this;
		(async () => {
			for(let localName in frames){
				let bitmexName = bitmexNames[localName];
				await self._loadHistorical(
						candles[localName],
						bitmexName,
						history_start)
			}
			this.restLoaded = true;
			for(let localName in frames){
				let bitmexName = bitmexNames[localName];
				this._connectTradeBins(`tradeBin${bitmexName}`,candles[localName]);
			}
		})();
	}
	_on(frame,next){
		this.onUpdate[frame] = next;
	}
	loaded(){
		return this.socketLoaded && this.restLoaded
	}
	async _loadHistorical(model,bitmexSpan,history_start){
		let since = new Date(history_start).getTime();
		let last = await model.last();
		if(last){
			since = last.time.getTime() - model.span*300;
		}
		while(true){
			clog(`getting historical ${model.frame} data from timestamp : ${new Date(since)}`);
			let data = await ccxt.fetchOHLCV(
					"BTC/USD",
					bitmexSpan,
					since,
					500,{
						partial : false
					});
			data = data.map((d)=>{
				d = model.parseCcxt(d);
				d = d.toObject();
				delete d._id;
				model.findOneAndUpdate({
					time : d.time
				},d,{
					upsert : true
				},(e,d) => {
					if(e)clog(e);
				});
				return d;
			});
			let now = new Date().getTime();
			if(data.length < 499){
				clog("got all histories",model.frame,"candles")
				break;
			}
			since = data[data.length - 1].time.getTime() + model.span;
			await sleep(2000);
		}

	}
	async _triggerUpdate(frame,data){
		if(this.converter.working){
			return;
		}
//		await this.converter.execute();
		/*await*/ this._test();
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
	async _connectTradeBins(table,model){
		let self = this;
		this.socket.addStream(
			"XBTUSD",
			table,
			(data, symbol, tableName) => {
				if(tableName != table || !data.length){
					return;
				}
				let before = data;
				data = data[data.length - 1];
				try{
					data = model.parseSocket(data);
				}catch(e){
					throw e;
				}
				// 15秒ぐらい遅れる
	//			clog(new Date().getTime() - data.timestamp.getTime())
				data = data.toObject();
				delete data._id;
				model.findOneAndUpdate({
					time : data.time
				},data,{
					upsert : true
				},(e,d) => {
					self.socketLoaded = true;
					model.findOne({
						time : data.time
					},(e,d) => {
						self._triggerUpdate(model.frame);
					});
				});
			}
		);
	}
}
