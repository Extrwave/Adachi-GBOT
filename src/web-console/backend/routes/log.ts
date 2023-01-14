import express from "express";
import bot from "ROOT";

export default express.Router().get( "/", async ( req, res ) => {
	const page = parseInt( <string>req.query.page ); // 当前第几页
	const length = parseInt( <string>req.query.length ); // 页长度
	const logLevel = <string>req.query.logLevel; // 日志等级
	const msgType = parseInt( <string>req.query.msgType ); // 消息类型 0：系统 1: 私聊 2: 频道
	const filterName = <string>req.query.filterName; // 查询名称，用户名或者频道名
	const utcDiffer = 8 * 60 * 60 * 1000;
	const date = new Date( parseInt( <string>req.query.date ) + utcDiffer ).toJSON();  // 日期时间戳
	
	if ( !page || !length || !date ) {
		res.status( 400 ).send( { code: 400, data: {}, msg: "Error Params" } );
		return;
	}
	
	const fileName: string = `logs/bot.${ date.split( "T" )[0] }.log`;
	const path: string = bot.file.getFilePath( fileName, "root" );
	
	try {
		if ( bot.file.isExist( path ) ) {
			const file = await bot.file.readFileByStream( fileName, "root", bot.config.webConsole.logHighWaterMark );
			const fullData = file.split( /[\n\r]/g ).filter( el => el.length !== 0 );
			const respData = fullData
				.map( el => JSON.parse( el ) )
				.filter( el => {
					/* 过滤日志等级 */
					if ( logLevel && el.level !== logLevel.toUpperCase() ) {
						return false;
					}
					if ( !Number.isNaN( msgType ) ) {
						/* 过滤消息类型 */
						const reg = /\[(Recv|Send)] \[(Guild|Private)] \[A: (.+)] \[G: (.+)]/;
						const result = reg.exec( el.message );
						/* result[1]为类别，result[2]为用户名，result[3]为频道名 */
						if ( result ) {
							const type = <'Guild' | 'Private'>result[2];
							/* 过滤频道或者私聊的选择 */
							if ( msgType !== ( type === 'Guild' ? 2 : 1 ) ) {
								return false;
							}
							/* 过滤频道名或者用户名的选择 */
							if ( filterName ) {
								const reg = new RegExp( filterName, "ig" );
								return reg.test( result[3] ) || reg.test( result[4] );
							}
						} else if ( msgType !== 0 ) {
							return false;
						}
					}
					return true;
				} );
			
			const pageRespData = respData.slice( ( page - 1 ) * length, page * length );
			res.status( 200 ).send( { code: 200, data: pageRespData, total: respData.length } );
			return;
		}
		res.status( 404 ).send( { code: 404, data: {}, msg: "NotFound" } );
	} catch ( e ) {
		res.status( 500 ).send( { code: 500, data: {}, msg: "Server Error" } );
	}
} );