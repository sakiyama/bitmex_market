"use strict";
import mongoose from 'mongoose';
import Candle from './Candle';
import Config from './Config';
import Observer from './Observer';
var redis = require("redis")
, subscriber = redis.createClient();
global.clog = console.log;

let timeframes = {
	"m1" : 1 * 60 * 1000,
	"m5" : 5 * 60 * 1000,
	"h1" : 60 * 60 * 1000,
	"d1" : 24 * 60 * 60 * 1000,
};
let configModel = mongoose.model("config",Config());

function createResult(mongoose,frames){
	let result = {};
	for( let frame in frames){
		result[frame] = mongoose.model(
				"candle_" + frame,
				Candle(frame,frames[frame]));
//		mongoose.connection.collections["candle_" + frame].drop((e => {
//			clog(e)
//		}));
	}
	return result;
}
module.exports = {
	server : async function(options){
		mongoose.connect(options.connection);
		let frames = Object.assign({},options.timeframes,timeframes);
		configModel.save(frames,options.history);
		let result = createResult(mongoose,frames);
		let observer = new Observer(
			result,
			timeframes,
			options.timeframes,
			options.history);
		return result;
	},
	client : async function(connection){
		mongoose.connect(connection);
		let config = await configModel.load();
		let frames = config.timeframes;
		let result = createResult(mongoose,frames);

		let callbacks = {};
		subscriber.on("message", function(channel, d) {
			if(callbacks[channel]){
				callbacks[channel](JSON.parse(d));
			}
		});
		for( let frame in frames){
			result[frame].on = (next) => {
				callbacks[frame] = next;
				subscriber.subscribe(frame);
			}
		}
		return result;
	},
};