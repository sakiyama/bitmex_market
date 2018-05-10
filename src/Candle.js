"use strict";
import mongoose from 'mongoose'
export default function Candle(frame,ms){
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