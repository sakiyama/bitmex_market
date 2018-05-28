"use strict";
import mongoose from 'mongoose'
let bitmexTimeFrames = {
	"1m" : 1 * 60 * 1000,
	"5m" : 5 * 60 * 1000,
	"1h" : 60 * 60 * 1000,
	"1d" : 24 * 60 * 60 * 1000,
};
function findBaseMs(ms){
	let found = false;
	for(let name in bitmexTimeFrames){
		if(bitmexTimeFrames[name] == ms){
			found = true;
			break;
		}
	}
	if(found){
		return null;
	}
	found = null;
	for(let name in bitmexTimeFrames){
		let baseMs = bitmexTimeFrames[name];
		if(ms % baseMs != 0 || ms / baseMs < 1){
			continue;
		}
		if(found == null || found < baseMs){
			found = baseMs;
		}
	}
	if(!found){
		throw `${frame} couldn't calculate`;
	}
	return found;
}
export default function Candle(ccxt,market,frame,ms,ccxtName,bitmexName){
	var candleSchema = new mongoose.Schema({
		// 開始時間 open time
		time : {
			type : Date,
			unique: true
		},
		open : Number,
		high : Number,
		low : Number,
		close : Number,
		volume : Number,
	});
	candleSchema.statics.ccxt = ccxt;
	candleSchema.statics.description = market;
	candleSchema.statics.market = {
		ccxt : ccxtName,
		bitmex : bitmexName
	};
	let baseMs = findBaseMs(ms);
	if(baseMs){
		candleSchema.statics.baseMs = baseMs;
	}
	candleSchema.statics.span = ms;
	candleSchema.statics.frame = frame;
	candleSchema.statics.first = function(){
		return this.findOne({
		},'-_id -__v',{
			sort : {
				time : 1
			}
		}).exec();
	};
	candleSchema.statics.upsertIfNew = function(d,ifnew){
		if(d._id){
			delete d._id;
		}
		this.findOneAndUpdate({
			time : d.time
		},d,{
			upsert : true
		},(e,old) => {
			if(e){
				throw e;
			}
			if(!old && ifnew){
				ifnew(d);
			}
		});
	}
	candleSchema.statics.fetch = async function(since,ifnew){
		let name = null;
		for(let property in bitmexTimeFrames){
			if(this.span != bitmexTimeFrames[property]){
				continue;
			}
			name = property;
			break;
		}
		var data = await ccxt.fetchOHLCV(
			ccxtName,
			name,
			since,
			500,{
				partial : false
			}
		);
		data = data.map((d)=>{
			d = this.parseCcxt(d);
			d = d.toObject();
			this.upsertIfNew(d,ifnew);
			return d;
		});
		return data;
	};
	candleSchema.statics.last = function(){
		return this.findOne({
		},'-_id -__v',{
			sort : {
				time : -1
			}
		}).exec();
	};
	// (d) => {}でやるとthis scopeがおかしなる
	candleSchema.statics.parseCcxt = function(d){
		return new this({
			time : d[0],
			open : d[1],
			high : d[2],
			low : d[3],
			close : d[4],
			volume : d[5],
		});
	};
	candleSchema.statics.parseSocket = function(d){
		d.time = new Date(d.timestamp).getTime() - ms;
		let result = new this(d);
		delete result.timestamp;
		return result;
	};
	candleSchema.methods.add = function(candle){
		if(this.time >= candle.time){
			throw "invalid candle";
		}
		this.high = Math.max(this.high,candle.high);
		this.low = Math.min(this.low,candle.low);
		this.close = candle.close;
		this.volume = this.volume + candle.volume;
	};
	candleSchema.methods.addTick = function(price,volume){
		this.high = Math.max(this.high,price);
		this.low = Math.min(this.low,price);
		this.close = price;
		this.volume += volume;
	};
	candleSchema.statics.load = function(limit = 1,endTime){
		let self = this;
		let option = {};
		if(endTime){
			option.time = {
				"$lte" : endTime
			};
		}
		return new Promise(resolve =>{
			self.find(option,'-_id -__v',{
				sort : {
					time : -1
				},
				limit : limit
			},(err,d)=>{
				d = d.reverse();
				resolve(d)
			});
		});
	};
	return candleSchema;
}