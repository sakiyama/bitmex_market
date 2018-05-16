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

let timeframes = {
	"m1": 1 * 60 * 1000,
	"m5": 5 * 60 * 1000,
	"h1": 60 * 60 * 1000,
	"d1": 24 * 60 * 60 * 1000
};
function createResult(connection, frames) {
	let result = {};
	for (let frame in frames) {
		result[frame] = connection.model("candle_" + frame, (0, _Candle2.default)(frame, frames[frame]));
	}
	return result;
}
module.exports = {
	server: async function (options) {
		let connection = _mongoose2.default.createConnection(options.mongo);
		let configModel = connection.model("config", (0, _Config2.default)());

		let frames = Object.assign({}, options.timeframes, timeframes);
		configModel.save(frames, options.history);
		let publisher = redis.createClient(options.redis);
		let result = createResult(connection, frames);
		let observer = new _Observer2.default(result, timeframes, options.timeframes, options.history, (channel, data) => {
			publisher.publish(channel, data);
		});
		return result;
	},
	client: async function (options) {
		let connection = _mongoose2.default.createConnection(options.mongo);
		let configModel = connection.model("config", (0, _Config2.default)());

		let config = await configModel.load();
		let frames = config.timeframes;
		let result = createResult(connection, frames);

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