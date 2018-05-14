import mongoose from 'mongoose';


export default function Config(){
	var configSchema = new mongoose.Schema({
		// 開始時間 open time
		timeframes : mongoose.Schema.Types.Mixed,
		history : Date
	});

	configSchema.statics.load = function(){
		return this.findOne({
		},'',{
		}).exec();
	};
	configSchema.statics.save = async function(timeframes,history){
		let old = await this.load();
		if(old){
			old.timeframes = timeframes;
			old.history = history;
		}else{
			old = new this({
				timeframes : timeframes,
				history : history
			});
		}
		return old.save();
	};
	return configSchema;
	let configModel = mongoose.model('config',configSchema);
}
