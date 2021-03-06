import { InputParameter, Order, OrderMatchResult } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";
import { SendFunc } from "@modules/message";
import { ErrorMsg } from "#genshin/utils/promise";
import * as ApiType from "#genshin/types";
import { scheduleJob } from "node-schedule";
import { pull } from "lodash";
import { getBaseInfo } from "#genshin/utils/api";
import { privateClass } from "#genshin/init";
import { decode } from "js-base64";
import { Account, getMemberInfo } from "@modules/utils/account";

const tempSubscriptionList: string[] = [];

async function subscribe( userID: string, send: SendFunc, a: AuthLevel, CONFIRM: Order ): Promise<string> {
	if ( tempSubscriptionList.includes( userID ) ) {
		return "您已经处于授权服务申请状态";
	}
	
	tempSubscriptionList.push( userID );
	
	const d = new Date();
	scheduleJob( d.setMinutes( d.getMinutes() + 3 ), async () => {
		const isFinish: string | undefined = tempSubscriptionList.find( el => el === userID );
		
		if ( isFinish !== undefined ) {
			pull( tempSubscriptionList, userID );
			await send( "授权服务申请超时，BOT 自动取消\n" +
				"请先检查发送消息内容是否符合要求\n" +
				"私聊可能会屏蔽掉发送的cookie信息" );
		}
	} );
	
	const info: Account | undefined = await getMemberInfo( userID );
	let title: string = `『${ userID }』您好 \n`;
	if ( info ) {
		title = `『 ${ info.account.nick } 』您好 \n`
	}
	
	return title +
		"请务必确保 BOT 持有者可信任\n" +
		`BOT承诺保护您的账户信息安全\n` +
		`确定开启授权功能请使用此指令\n ` +
		`「 ${ CONFIRM.getHeaders()[0] } cookie 」 来继续\n` +
		"cookie是需要按照教程获取并替换\n" +
		"请在 3 分钟内进行超时会自动取消\n" +
		"频道发送「 @BOT 教程 」获取教程";
	
}

async function confirm(
	userID: string, cookie: string,
	a: AuthLevel, SUBSCRIBE: Order
): Promise<string> {
	if ( !tempSubscriptionList.some( el => el === userID ) ) {
		return `你还未申请授权服务，请先使用「${ SUBSCRIBE.getHeaders()[0] }」`;
	}
	
	/* 由于腾讯默认屏蔽含有cookie消息，故采用base64加密一下？试试 */
	const reg = new RegExp( /.*?ltuid=([0-9]+).*?/g );
	let execRes: RegExpExecArray | null = reg.exec( cookie );
	let execResBase64: RegExpExecArray | null = reg.exec( decode( cookie ) );
	if ( execRes === null ) {
		let resMsg = "正在尝试Base64解码cookie...\n"
		if ( execResBase64 === null )
			return resMsg + "抱歉，请重新提交正确的 cookie\n" +
				`cookie是需要按照教程获取并替换\n` +
				`实在有问题请前往BOT官方频道反馈`;
		else {
			execRes = execResBase64;
			cookie = decode( cookie );
		}
	}
	const mysID: number = parseInt( execRes[1] );
	const { retcode, message, data } = await getBaseInfo( mysID, cookie );
	
	if ( !ApiType.isBBS( data ) ) {
		return ErrorMsg.UNKNOWN;
	} else if ( retcode !== 0 ) {
		return ErrorMsg.FORM_MESSAGE + message;
	} else if ( !data.list || data.list.length === 0 ) {
		return ErrorMsg.NOT_FOUND;
	}
	
	const genshinInfo: ApiType.Game | undefined = data.list.find( el => el.gameId === 2 );
	if ( !genshinInfo ) {
		return ErrorMsg.NOT_FOUND;
	}
	
	const uid: string = genshinInfo.gameRoleId;
	pull( tempSubscriptionList, userID );
	return await privateClass.addPrivate( uid, cookie, userID );
}

export async function main(
	{ sendMessage, messageData, matchResult, auth, command }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const data: string = messageData.msg.content;
	
	const header = ( <OrderMatchResult>matchResult ).header;
	const a: AuthLevel = await auth.get( userID );
	
	const CONFIRM = <Order>command.getSingle( "silvery-star-private-confirm", a );
	const SUBSCRIBE = <Order>command.getSingle( "silvery-star-private-subscribe", a );
	
	if ( SUBSCRIBE.getHeaders().includes( header ) ) {
		const msg: string = await subscribe( userID, sendMessage, a, CONFIRM );
		await sendMessage( msg );
	} else if ( CONFIRM.getHeaders().includes( header ) ) {
		const msg: string = await confirm( userID, data, a, SUBSCRIBE );
		await sendMessage( msg );
	}
}