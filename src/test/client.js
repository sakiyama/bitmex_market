import Market from '../index';

(async () => {
	let market = await Market.client(
		// mongoose connection string
		"mongodb://test_user:test_password@127.0.0.1:27017/test_db"
	);
	market.m1.on((d)=>{
		console.log('m1',d);
	});
	market.m2.on((d)=>{
		console.log('m2',d);
	});
	//market.m5.on((d)=>{
//			console.log('m5',d);
	//});
	market.m15.on((d)=>{
		console.log('m15',d);
	});
	market.h2.on((d)=>{
		console.log('h2',d);
	});
	let candles = await market.m1.load(100);
	console.log(candles)
})();

