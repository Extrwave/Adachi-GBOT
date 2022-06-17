import { HEADERS } from "#cloud_genshin/util/api";
import bot from "ROOT";

/**
Author: Ethereal
CreateTime: 2022/6/17
 */

export async function getHeaders( userId: string ): Promise<HEADERS> {
	//获取用户信息填充header
	const dbKey = "extr-wave-yys-sign." + userId;
	let headers: HEADERS = {
		'x-rpc-combo_token': "",
		'x-rpc-client_type': 2,  //默认安卓
		'x-rpc-app_version': "2.4.0", //当前云原神版本
		'x-rpc-sys_version': 12.0, //当前安卓版本
		'x-rpc-channel': 'mihoyo',
		'x-rpc-device_id': "3fe1b5d6-441d-3698-a43c-d334a2d078aa",
		'x-rpc-device_name': "Meizu 16s Pro",
		'x-rpc-device_model': "16s Pro",
		'x-rpc-app_id': "1953439974",
		'Referer': 'https://app.mihoyo.com',
		'Host': 'api-cloudgame.mihoyo.com',
		'Connection': 'Keep-Alive',
		'Accept-Encoding': 'gzip',
		'User-Agent': 'okhttp/4.9.0'
	};
	headers['x-rpc-combo_token'] = await bot.redis.getHashField( dbKey, "token" );
	headers["x-rpc-device_name"] = await bot.redis.getHashField( dbKey, "device_name" );
	headers["x-rpc-device_model"] = await bot.redis.getHashField( dbKey, "device_model" );
	headers["x-rpc-device_id"] = await bot.redis.getHashField( dbKey, "device_id" );
	return headers;
}