"use strict";

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _Candle = require('./Candle');

var _Candle2 = _interopRequireDefault(_Candle);

var _Config = require('./Config');

var _Config2 = _interopRequireDefault(_Config);

var _Observer = require('./Observer');

var _Observer2 = _interopRequireDefault(_Observer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var redis = require("redis");
global.clog = console.log;

let timeframes = {
	"m1": 1 * 60 * 1000,
	"m5": 5 * 60 * 1000,
	"h1": 60 * 60 * 1000,
	"d1": 24 * 60 * 60 * 1000
};
let configModel = _mongoose2.default.model("config", (0, _Config2.default)());

function createResult(mongoose, frames) {
	let result = {};
	for (let frame in frames) {
		result[frame] = mongoose.model("candle_" + frame, (0, _Candle2.default)(frame, frames[frame]));
		//		mongoose.connection.collections["candle_" + frame].drop((e => {
		//			clog(e)
		//		}));
	}
	return result;
}
module.exports = {
	server: async function (options) {
		_mongoose2.default.connect(options.mongo);
		let frames = Object.assign({}, options.timeframes, timeframes);
		configModel.save(frames, options.history);
		let publisher = redis.createClient(options.redis);
		let result = createResult(_mongoose2.default, frames);
		let observer = new _Observer2.default(result, timeframes, options.timeframes, options.history, (channel, data) => {
			publisher.publish(channel, data);
		});
		return result;
	},
	client: async function (options) {
		_mongoose2.default.connect(options.mongo);
		let config = await configModel.load();
		let frames = config.timeframes;
		let result = createResult(_mongoose2.default, frames);

		let subscriber = redis.createClient(options.redis);
		let callbacks = {};
		subscriber.on("message", function (channel, d) {
			if (callbacks[channel]) {
				callbacks[channel](JSON.parse(d));
			}
		});
		for (let frame in frames) {
			result[frame].on = next => {
				callbacks[frame] = next;
				subscriber.subscribe(frame);
			};
		}
		return result;
	}
};