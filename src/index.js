"use strict";
import mongoose from 'mongoose';
import Candle from './Candle';
import Config from './Config';
import Observer from './Observer';
var redis = require("redis");

let timeframes = {
	"m1" : 1 * 60 * 1000,
	"m5" : 5 * 60 * 1000,
	"h1" : 60 * 60 * 1000,
	"d1" : 24 * 60 * 60 * 1000,
};
function createResult(connection,frames,markets){
	let result = {};
	for(let ccxtName in markets){
		let bitmexName = markets[ccxtName];
		result[bitmexName] = {};
		for( let frame in frames){
			let schema = Candle(frame,frames[frame],ccxtName,bitmexName);
			let collection = bitmexName.toLowerCase() + "_" + frame;
			result[bitmexName][frame] = connection.model(collection,schema);
		}
	}
	return result;
}
module.exports = {
	server : async function(options){
		let connection = mongoose.createConnection(options.mongo);
		let configModel = connection.model("config",Config());

		let frames = Object.assign({},options.timeframes,timeframes);

//		for(let frame in frames){
//			connection.dropCollection("candle_" + frame, function(err, result) {
//				console.log(err, result);
//			});
//		}
//		return;

		configModel.save(frames,options.history,options.markets);
		let publisher = redis.createClient(options.redis);
		let result = createResult(connection,frames,options.markets);
		let observers = [];
		for(let market in result){
			let observer = new Observer(
				result[market],
				timeframes,
				options.timeframes,
				options.history,
				(market,frame,data) => {
					publisher.publish(`${market.bitmex}_${frame}`,data);
				});
			observers.push(observer);
		}

		return result;
	},
	client : async function(options){
		let connection = mongoose.createConnection(options.mongo);
		let configModel = connection.model("config",Config());

		let config = await configModel.load();
		let frames = config.timeframes;
		let result = createResult(connection,frames,config.markets);

		let subscriber = redis.createClient(options.redis);

		let callbacks = {};
		for(let market in result){
			callbacks = {};
			subscriber.on("message", function(channel, d) {
				if(callbacks[channel]){
					callbacks[channel](JSON.parse(d));
				}
			});
			for( let frame in frames){
				result[market][frame].on = (next) => {
					let channel = `${market}_${frame}`;
					callbacks[channel] = next;
					subscriber.subscribe(channel);
				}
			}
		}
		return result;
	},
};