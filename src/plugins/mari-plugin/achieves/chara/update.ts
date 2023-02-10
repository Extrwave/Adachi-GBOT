import { BOT } from "@modules/bot";
import { InputParameter } from "@modules/command";
import { charaDetailPromise } from "#mari-plugin/utils/promise";
import * as ApiType from "#mari-plugin/types";
import { config } from "@plugins/mari-plugin/init";
import { isAt, getUID } from "@plugins/mari-plugin/utils/message";
import { Private } from "@plugins/genshin/module/private/main";
import { getPrivateAccount } from "@plugins/genshin/utils/private";


export async function main
( { sendMessage, messageData, redis, logger }: InputParameter ): Promise<void> {
	
	const msg: string = messageData.msg.content;
	const userID: string = messageData.msg.author.id;
	const isClear = msg === "-c";
	
	const atID: string | undefined = isAt( msg );
	const orderQuery: boolean = !!( !isClear && msg && msg.length !== 9 && !atID );
	
	if ( !config.uidQuery && !orderQuery ) {
		sendMessage( "bot 持有者已关闭 uid 和 @ 更新功能" );
		return;
	}
	//判断是否序号查询
	let uid: number;
	if ( orderQuery ) {
		const account: Private | string = await getPrivateAccount( userID, msg );
		if ( typeof account === "string" ) {
			await sendMessage( account );
			return;
		}
		uid = parseInt( account.setting.uid );
	} else {
		/* 检查是否绑定了uid */
		const { info } = await getUID( isClear ? "" : msg, userID, redis, atID );
		if ( typeof info === "string" ) {
			await sendMessage( info );
			return;
		}
		uid = info;
	}
	if ( messageData.msg.content === "-c" ) {
		await redis.deleteKey( `mari-plugin.chara-detail-list-${ uid }` );
		await sendMessage( `「${ uid }」的面板存储数据已清空` );
		return;
	}
	
	/* 是否为更新自己 */
	const self = !msg;
	
	let detail: ApiType.Detail;
	
	try {
		detail = await charaDetailPromise( uid, self, sendMessage, true );
	} catch ( error ) {
		if ( typeof error === "string" ) {
			await sendMessage( <string>error );
		} else {
			logger.error( error );
		}
		return;
	}
	
	const avatarNames: string = detail.avatars.map( a => a.name ).join( '，' );
	
	const msgUser = self ? "" : `用户「${ uid }」`;
	await sendMessage( `更新面板数据成功，${ msgUser }当前可查询角色列表为：${ avatarNames }` );
}