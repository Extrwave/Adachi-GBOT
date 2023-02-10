import bot from "ROOT";
import axios, { AxiosError } from "axios";
import { guid } from "#genshin/utils/guid";
import { Cookies } from "#genshin/module";
import { generateDS, getGameBiz } from "#genshin_draw_analysis/util/util";
import { AuthKey, GachaPoolInfo } from "#genshin_draw_analysis/util/types";
import { checkCookieInvalidReason } from "../../genshin/utils/cookie";

const API = {
	AUTH_KEY: "https://api-takumi.mihoyo.com/binding/api/genAuthKey",
	TOKEN: "https://api-takumi.mihoyo.com/auth/api/getMultiTokenByLoginTicket",
	POOL: "https://webstatic.mihoyo.com/hk4e/gacha_info/cn_gf01/gacha/list.json"
}

const HEADERS = {
	"cookie": "",
	"ds": "",
	"host": "api-takumi.mihoyo.com",
	"referer": "https://app.mihoyo.com",
	"user-agent": "okhttp/4.8.0",
	"x-rpc-app_version": "2.28.1",
	"x-rpc-channel": "mihoyo",
	"x-rpc-client_type": "2",
	"x-rpc-device_id": guid(),
	"x-rpc-device_model": "SM-977N",
	"x-rpc-device_name": "Samsung SM-G977N",
	"x-rpc-sys_version": "12",
};

export async function generateAuthKey( uid: string, server: string, cookie: string ): Promise<AuthKey> {
	return new Promise( ( resolve, reject ) => {
		const data = {
			auth_appid: "webview_gacha",
			game_biz: getGameBiz( uid[0] ),
			game_uid: uid,
			region: server
		};
		axios.post( API.AUTH_KEY, data, {
			headers: {
				...HEADERS,
				"ds": generateDS(),
				"cookie": cookie
			},
			timeout: 5000
		} ).then( ( { data: { retcode, message, data } } ) => {
			if ( retcode === 10001 || retcode !== 0 ) {
				reject( checkCookieInvalidReason( Cookies.checkMysID( cookie ), message ) );
				return;
			}
			resolve( data );
		} ).catch( reason => {
			if ( axios.isAxiosError( reason ) ) {
				let err = <AxiosError>reason;
				reject( `生成authKey失败, reason: ${ err.message }` )
			} else {
				reject( reason );
			}
		} )
	} )
}

export async function getSToken( userId: number, loginTicket: string, cookie: string ): Promise<any> {
	const params = {
		login_ticket: loginTicket,
		token_types: "3",
		uid: userId
	};
	return new Promise( ( resolve, reject ) => {
		axios.get( API.TOKEN, {
			headers: {
				...HEADERS,
				"origin": "https://webstatic.mihoyo.com",
				"referer": "https://webstatic.mihoyo.com/",
				"user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) miHoYoBBS/2.28.1",
				"x-requested-with": "com.mihoyo.hyperion",
				"ds": generateDS(),
				"cookie": cookie
			},
			params,
			timeout: 5000
		} ).then( ( { data: { retcode, message, data } } ) => {
			if ( retcode === 10001||retcode !== 0 ) {
				reject( checkCookieInvalidReason( Cookies.checkMysID( cookie ), message ) );
				return;
			}

			resolve( data );
		} ).catch( reason => {
			if ( axios.isAxiosError( reason ) ) {
				let err = <AxiosError>reason;
				reject( `获取sToken失败, reason: ${ err.message }` );
			} else {
				reject( reason );
			}
		} )
	} )
}

export async function updatePoolId(): Promise<GachaPoolInfo> {
	const gacha_pool_info: string = await bot.redis.getString( "genshin_gacha.pool_info" );
	if ( gacha_pool_info ) {
		return Promise.resolve( JSON.parse( gacha_pool_info ) );
	}
	
	return new Promise( ( resolve, reject ) => {
		axios.get( API.POOL, { timeout: 5000 } ).then( ( { data: { retcode, message, data } } ) => {
			if ( retcode !== 0 ) {
				reject( "米游社接口报错: " + message );
				return;
			}
			bot.redis.setString( "genshin_gacha.pool_info", JSON.stringify( data.list[0] ), 60 * 60 * 24 * 30 );
			resolve( data.list[0] );
		} ).catch( reason => {
			if ( axios.isAxiosError( reason ) ) {
				let err = <AxiosError>reason;
				reject( `更新卡池 ID 失败, reason: ${ err.message }` )
			} else {
				reject( reason );
			}
		} )
	} )
}