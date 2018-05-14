"use strict";
import mongoose from 'mongoose';
import Candle from './Candle';
import Observer from './Observer';
global.clog = console.log;

let timeframes = {
	"m1" : 1 * 60 * 1000,
	"m5" : 5 * 60 * 1000,
	"h1" : 60 * 60 * 1000,
	"d1" : 24 * 60 * 60 * 1000,
};
module.exports = function(options){
	mongoose.connect(options.connection);
	let result = {};
	let frames = Object.assign({},options.timeframes,timeframes);
	for( let frame in frames){
		result[frame] = mongoose.model(
				"candle_" + frame,
				Candle(frame,frames[frame]));
//		mongoose.connection.collections["candle_" + frame].drop((e => {
//			clog(e)
//		}));
	}
	let observer = new Observer(
			result,
			timeframes,
			options.timeframes,
			options.history);
	for( let frame in frames){
		result[frame].on = (next) => {
			observer._on(frame,next);
		}
	}
	return result;
};
