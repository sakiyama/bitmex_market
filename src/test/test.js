import Market from '../index';

let market = Market({
	// mongoose connection string
	connection : "mongodb://test_user:test_password@127.0.0.1:27017/test_db",
	// optional time frames
	// m1,m5,h1,d1 are bitmex default time frames
	// all frames must be able to calculate from these time frames.
	timeframes : {
		"m2" : 2 * 60 * 1000,// { name : ms }
		"m15" : 15 * 60 * 1000,// { name : ms }
		"h2" : 2 * 60 * 60 * 1000,// { name : ms }
	},
	// getting historical data form below
	history : "2018-01-01T00:00:00.000Z", // Z make this utc
});
market.m1.on((d)=>{
	console.log('m1',d);
});
market.m2.on((d)=>{
	console.log('m2',d);
});
//market.m5.on((d)=>{
//	console.log('m5',d);
//});
market.m15.on((d)=>{
	console.log('m15',d);
});
market.h2.on((d)=>{
	console.log('h2',d);
});
//
//(async () => {
//	let candles = await market.m1.load(100);
//	console.log(candles)
//})();
