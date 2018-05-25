import Market from '../index';
import Ccxt from 'ccxt';
let ccxt = new Ccxt.bitmex();

Market.server({
	// mongoose connection string
	mongo : "mongodb://test_user:test_password@127.0.0.1:27017/test_db",
	//
	redis : {
		host : "127.0.0.1",
		port : 6379,
		password : "test_redis_password"
	},
	markets : {
		'BCHM18':'BCHM18',
		'BTC/USD':'XBTUSD',
		'ETHM18':'ETHM18',
		'LTCM18':'LTCM18',
		'ADAM18':'ADAM18',
		'XRPM18':'XRPM18'
	},
	// optional time frames
	// m1,m5,h1,d1 are bitmex default time frames
	// all frames must be able to calculate from these time frames.
	timeframes : {
		"m2" : 2 * 60 * 1000,// { name : ms }
		"m15" : 15 * 60 * 1000,// { name : ms }
		"m30" : 30 * 60 * 1000,// { name : ms }
		"h2" : 2 * 60 * 60 * 1000,// { name : ms }
		"h4" : 4 * 60 * 60 * 1000,// { name : ms }
	},
	// getting historical data form below
	history : "2018-04-01T00:00:00.000Z", // Z make this utc
});

(async () =>{
//	let result = await ccxt.loadMarkets();
//	console.log(Object.keys(result));
//	var data = await ccxt.fetchOHLCV(
//			"LTCM18",
//			"1h",
//			new Date("2018/05/24Z"),
//			10,{
//				partial : false
//			}
//		);
//	console.log(data)
})();
