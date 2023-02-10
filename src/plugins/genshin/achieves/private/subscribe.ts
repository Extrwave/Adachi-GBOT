import { pull } from "lodash";
import { scheduleJob } from "node-schedule";
import { SendFunc } from "@modules/message";
import { privateClass } from "#genshin/init";
import { AuthLevel } from "@modules/management/auth";
import { Account, getMemberInfo } from "@modules/utils/account";
import { InputParameter, Order, OrderMatchResult } from "@modules/command";
import { checkCookieInvalidReason, checkMysCookieInvalid } from "#genshin/utils/cookie";

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
	userID: string, rawCookie: string,
	a: AuthLevel, SUBSCRIBE: Order
): Promise<string> {
	try {
		if ( !tempSubscriptionList.some( el => el === userID ) ) {
			return `你还未申请授权服务，请先使用「${ SUBSCRIBE.getHeaders()[0] }」`;
		}
		/* 对Cookie进行简化保留 */
		const { uid, cookie, cookieV2 } = await checkMysCookieInvalid( rawCookie );
		pull( tempSubscriptionList, userID );
		return await privateClass.addPrivate( uid, cookie, userID, cookieV2 );
	} catch ( error ) {
		return checkCookieInvalidReason( <string>error );
	}
}

export async function main(
	{ sendMessage, messageData, matchResult, auth, command }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const data: string = messageData.msg.content;
	
	const header = ( <OrderMatchResult>matchResult ).header;
	
	const CONFIRM = <Order>command.getSingle( "silvery-star-private-confirm", AuthLevel.Master );
	const SUBSCRIBE = <Order>command.getSingle( "silvery-star-private-subscribe", AuthLevel.Master );
	
	if ( SUBSCRIBE.getHeaders().includes( header ) ) {
		const msg: string = await subscribe( userID, sendMessage, AuthLevel.Master, CONFIRM );
		await sendMessage( msg );
	} else if ( CONFIRM.getHeaders().includes( header ) ) {
		const msg: string = await confirm( userID, data, AuthLevel.Master, SUBSCRIBE );
		await sendMessage( msg );
	}
}