import Market from '../index';

(async () => {
	let market = await Market.client({
		// mongoose connection string
		mongo : "mongodb://test_user:test_password@127.0.0.1:27017/test_db",
		//
		redis : {
			host : "127.0.0.1",
			port : 6379,
			password : "test_redis_password"
		},
	});
	market = market.XBTUSD;
	market.m1.on((d)=>{
		console.log('m1',d);
	});
	market.m2.on((d)=>{
		console.log('m2',d);
	});
	market.m5.on((d)=>{
		console.log('m5',d);
	});
	market.m15.on((d)=>{
		console.log('m15',d);
	});
	market.h2.on((d)=>{
		console.log('h2',d);
	});
	market.d1.on((d)=>{
		console.log('d1',d);
	});
	let candles = await market.m1.load(3);
	console.log(candles)
})();

