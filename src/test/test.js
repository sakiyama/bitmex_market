import Market from '../index';

let market = Market({
	// mongoose connection string
	connection : "mongodb://test_user:test_password@127.0.0.1:27017/test_db",
	// optional time frames
	// m1,m5,h1,d1 are bitmex default time frames
	// all frames must be able to calculate from m1
	timeframes : {
		"h2" : 2 * 60 * 60 * 1000,// { name : ms }
	},
	// getting historical data form below
	history : "2018-05-01T00:00:00.000Z", // Z make this utc
});
market.m1.on((d)=>{
	console.log('m1',d);
});
market.m5.on((d)=>{
	console.log('m5',d);
});

(async () => {
	let candles = await market.m1.load(100);
//	console.log(candles)
})();
