'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = Config;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Config() {
	var configSchema = new _mongoose2.default.Schema({
		// 開始時間 open time
		timeframes: _mongoose2.default.Schema.Types.Mixed,
		history: Date
	});

	configSchema.statics.load = function () {
		return this.findOne({}, '', {}).exec();
	};
	configSchema.statics.save = async function (timeframes, history) {
		let old = await this.load();
		if (old) {
			old.timeframes = timeframes;
			old.history = history;
		} else {
			old = new this({
				timeframes: timeframes,
				history: history
			});
		}
		return old.save();
	};
	return configSchema;
	let configModel = _mongoose2.default.model('config', configSchema);
}