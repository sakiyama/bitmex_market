"use strict";
import BitMEXClient from 'bitmex-realtime-api';

export default class Converter{
	constructor() {
		this.working = false;
	}
	async execute(){
		this.working = true;
		let first = await mongo.candle.m1.first();
		let start = first.time.getTime();
		for(let timeFrame in config.timeframes){
			if(timeFrame == "m1"){
				continue;
			}
			await frameEach(start,timeFrame);
		}
		this.working = false;
	}
	static talib(mongo_candles){
		let keys = Object.keys(mongo_candles[0]);
		let result = {};
		keys.forEach(p => {
			result[p] = [];
		});
		mongo_candles.forEach(d => {
			keys.forEach(p => {
				result[p].push(d[p]);
			});
		})
		return result;
	}
}
async function frameEach(start,timeFrame){
	let timeFrameNumber = config.timeframes[timeFrame];
	let candleCount = timeFrameNumber / config.timeframes.m1;
	let searchStart = start;
	let last = await mongo.candle[timeFrame].last();
	if(last){
		let targetStart = last.time;
		targetStart = targetStart.getTime() + timeFrameNumber;
		if(targetStart > start){
			searchStart = targetStart;
		}
	}
//	clog(timeFrame,"starting from",new Date(searchStart))
	let count = 0;
	while(true){
		let result = await candleEach(
			searchStart,
			timeFrame,
			timeFrameNumber,
			candleCount);
		if(!result){
//			clog(timeFrame,"converted to",new Date(searchStart))
			break;
		}
		searchStart += timeFrameNumber;
		count++;
		if(count % 1000 == 0){
//			clog(timeFrame,count,"converted and saved");
		}
	}
}
function candleEach(
		start,
		timeFrame,
		timeFrameNumber,
		candleCount){
	return new Promise(resolve =>{
		mongo.candle.m1.find({
			time : {
				$gte : start,
				$lt : start + timeFrameNumber
			}
		},{
		},{
			sort : {
				time : 1
			}
		},(err,candles) =>{
			if(candleCount != candles.length){
				return resolve(null)
			}
			let converted;
			candles.forEach(c => {
				if(converted){
					converted.add(c);
				}else{
					converted = new mongo.candle[timeFrame]();
					converted.time = c.time;
					converted.timestamp = c.time.getTime() + timeFrameNumber;
					converted.open = c.open;
					converted.high = c.high;
					converted.low = c.low;
					converted.close = c.close;
					converted.volume = c.volume;
					converted.vwap = c.vwap;
				}
			});
			converted.save((e,d)=>{
				if(e){
					clog("save failed")
					clog("converted",converted)
					clog("candles",candles)
					throw e;
				}
			});
			resolve(converted)
		});
	});
}
