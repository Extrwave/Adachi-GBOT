import bot from "ROOT";
import fetch from "node-fetch";
import { renderer } from "../init";
import { IMessage } from "qq-guild-bot";
import { RenderResult } from "@modules/renderer";
import { AuthLevel } from "@modules/management/auth";
import { InputParameter, Order } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { getPrivateAccount } from "#genshin/utils/private";
import { AuthKey, DB_KEY, GachaPoolInfo } from "#genshin_draw_analysis/util/types";
import { getGameBiz, sleep } from "#genshin_draw_analysis/util/util";
import { generateAuthKey, getSToken, updatePoolId } from "#genshin_draw_analysis/util/api";
import { cookie2Obj } from "@plugins/genshin/utils/cookie";
import { obj2ParamsStr } from "@modules/utils";
import { MessageToSend } from "@modules/utils/message";

export async function analysisHandler( uid: string, style: string, sendMessage: ( content: MessageToSend | string, atUser?: boolean ) => Promise<IMessage | void> ) {
	const res: RenderResult = await renderer.asBase64(
		style === "2" ? "/analysis.html" : "/analysis-phone.html",
		{ uid: uid }
	);
	if ( res.code === "base64" ) {
		await sendMessage( { file_image: res.data } );
	} else if ( res.code === "url" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}

export async function main(
	{ sendMessage, messageData, redis, logger }: InputParameter
): Promise<void> {
	const userID = messageData.msg.author.id, raw_message = messageData.msg.content;
	const reg = new RegExp( /(?<sn>\d+)?(\s)*(?<style>\d+)?/ );
	const res: RegExpExecArray | null = reg.exec( raw_message );
	const style: string = res?.groups?.style || "";
	const sn: string = res?.groups?.sn || "1";
	
	const account = await getPrivateAccount( userID, sn );
	if ( typeof account === 'string' ) {
		await sendMessage( account );
		return;
	}
	let uid = account.setting.uid;
	
	let url = await redis.getString( `${ DB_KEY.ANALYSIS_URL }-${ uid }` );
	if ( !url || url.indexOf( "http" ) <= -1 ) {
		let info: Private | string | undefined;
		// 从私人服务获取V2版本Cookie
		let cookie = account.setting.cookieV2;
		let game_uid = account.setting.uid;
		let server = account.setting.server;
		let mysID = account.setting.mysID;
		
		try {
			if ( !cookie ) {
				const PR = <Order>bot.command.getSingle( "silvery-star-private-replace", AuthLevel.Master );
				await sendMessage( `需要V2版本Cookie，请查看教程获取并通过 ${ PR.getHeaders()[0] } 更新` );
				return;
			}
			
			const { stoken } = cookie2Obj( cookie );
			if ( !cookie.includes( "stuid" ) ) {
				cookie = cookie + ";stuid=" + mysID;
			}
			if ( !cookie.includes( "login_uid" ) ) {
				cookie = cookie + ";login_uid=" + mysID;
			}
			cookie = cookie + ";stoken=" + stoken;
			
			const { authkey, authkey_ver, sign_type }: AuthKey = await generateAuthKey( game_uid, server, cookie );
			const { gacha_id, gacha_type }: GachaPoolInfo = await updatePoolId();
			const game_biz: string = getGameBiz( game_uid[0] );
			const params: object = {
				"authkey_ver": authkey_ver,
				"sign_type": sign_type,
				"auth_appid": "webview_gacha",
				"init_type": `${ gacha_type || "200" }`,
				"gacha_id": `${ gacha_id || "3c9dbe90839b4482907f14f08321b6fed9d7de11" }`,
				"timestamp": ( Date.now() / 1000 | 0 ).toString( 10 ),
				"lang": "zh-cn",
				"device_type": "mobile",
				"plat_type": "android",
				"region": server,
				"authkey": authkey,
				"game_biz": game_biz,
				"gacha_type": "301",
				"page": "1",
				"size": "5",
				"end_id": 0,
			}
			if ( game_biz === 'hk4e_cn' ) {
				url = "https://hk4e-api.mihoyo.com/event/gacha_info/api/getGachaLog?";
			} else {
				url = "https://hk4e-api-os.mihoyo.com/event/gacha_info/api/getGachaLog?";
			}
			url = url + obj2ParamsStr( params );
			
			// 校验URL
			const tmp: string = encodeURI( url ).replace( /\+/g, "%2B" );
			let response = await fetch( tmp, { method: "GET" } );
			let data = await response.json();
			if ( data.retcode === 0 ) {
				await redis.setHashField( `${ DB_KEY.ANALYSIS_COOKIE }-${ uid }`, "cookie", cookie );
				// 校验成功放入缓存，不需要频繁生成URL
				await redis.setString( `${ DB_KEY.ANALYSIS_URL }-${ uid }`, tmp, 24 * 60 * 60 );
			}
		} catch ( e ) {
			logger.error( e );
			await sendMessage( <string>e );
			return;
		}
	}
	
	let arrEntities = { 'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"' };
	let url2 = url.replace( /&(lt|gt|nbsp|amp|quot);/ig, function ( all, t ) {
		return arrEntities[t];
	} );
// const cardPool = {'301': '限定池1', '302': '武器池', '200': '常驻池', '400': '限定池2', '100': '新手池'};
	const cardPool = { '301': '限定池1', '302': '武器池', '200': '常驻池', '100': '新手池' };
	const keys = Object.keys( cardPool );
	const urlObj = new URL( url2 );
	for ( let index = 0; index < keys.length; index++ ) {
		let page = 1;
		let size = 20;
		let endCode = '0';
		const element = keys[index];
		const element2 = keys[index];
		let length = size;
		let next = false;
		do {
			const searchParams = urlObj.searchParams;
			searchParams.set( "page", `${ page }` );
			searchParams.set( "size", `${ size }` );
			searchParams.set( "end_id", endCode );
			searchParams.set( "gacha_type", element );
			if ( !searchParams.has( "game_biz" ) ) {
				searchParams.set( "game_biz", "hk4e_cn" );
			}
			url = urlObj.toString().replace( /\+/g, "%2B" )
			let response = await fetch( url, { method: "GET" } );
			let data = await response.json();
			if ( data.retcode !== 0 && data.message && data.message.toLowerCase() == 'visit too frequently' ) {
				await sleep( 5000 );
				response = await fetch( url, { method: "GET" } );
				data = await response.json();
			}
			if ( data.retcode === -101 ) {
				await redis.deleteKey( `${ DB_KEY.ANALYSIS_URL }-${ uid }` );
				await sendMessage( 'AuthKey 已过期，缓存链接已删除，请重试!' );
				return;
			}
			if ( data.retcode !== 0 ) {
				await sendMessage( data.message ? data.message : "抽卡记录拉取失败，请检查URL！" );
				return;
			}
			length = data.data.list.length;
			for ( let index = 0; index < length; index++ ) {
				const element = data.data.list[index];
				endCode = element.id;
				uid = element.uid;
				let hasKey = await redis.existHashKey( `${ DB_KEY.ANALYSIS_DATA }-${ element2 }-${ element.uid }`, endCode );
				if ( hasKey ) {
					next = true;
					break;
				}
				await redis.setHash( `${ DB_KEY.ANALYSIS_DATA }-${ element2 }-${ element.uid }`, { [endCode]: JSON.stringify( element ) } );
			}
			page++;
			await sleep( 200 );
			if ( next ) {
				break;
			}
		} while ( length === size );
	}
	
	await analysisHandler( uid, style, sendMessage );
}