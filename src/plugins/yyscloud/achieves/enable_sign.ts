import { InputParameter, Order, OrderMatchResult } from "@modules/command";
import { savaUserData } from "../util/user_data";
import { SendFunc } from "@modules/message";
import { AuthLevel } from "@modules/management/auth";
import { scheduleJob } from "node-schedule";
import { pull } from "lodash";
import { decode } from "js-base64";
import { Account, getMemberInfo } from "@modules/utils/account";

const tempSubscriptionList: string[] = [];

async function subscribe( userID: string, send: SendFunc, a: AuthLevel, CONFIRM: Order ): Promise<string> {
	
	if ( tempSubscriptionList.includes( userID ) ) {
		return "您已经处于云原神签到服务申请状态";
	}
	
	tempSubscriptionList.push( userID );
	
	const d = new Date();
	scheduleJob( d.setMinutes( d.getMinutes() + 3 ), async () => {
		const isFinish: string | undefined = tempSubscriptionList.find( el => el === userID );
		
		if ( isFinish !== undefined ) {
			pull( tempSubscriptionList, userID );
			await send( "云原神签到服务申请超时，BOT 自动取消\n" +
				"请先检查发送消息内容是否符合要求\n" +
				"私聊可能会屏蔽掉发送的 token信息\n" );
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
		`「 ${ CONFIRM.getHeaders()[0] } token 」 来继续\n` +
		"token是需要按照教程获取并替换\n" +
		"请在 3 分钟内进行超时会自动取消\n" +
		"频道发送「 @BOT 教程 」获取教程 \n";
}

async function confirm(
	userID: string, token: string,
	a: AuthLevel, SUBSCRIBE: Order
): Promise<string> {
	if ( !tempSubscriptionList.some( el => el === userID ) ) {
		return `你还未申请云原神签到服务，请先使用「${ SUBSCRIBE.getHeaders()[0] }」申请`;
	}
	
	const reg = new RegExp( /.*?oi=([0-9]+).*?/g );
	let execRes: RegExpExecArray | null = reg.exec( token );
	let execResBase64: RegExpExecArray | null = reg.exec( decode( token ) );
	if ( execRes === null ) {
		let resMsg = "正在尝试Base64解码token...\n"
		if ( execResBase64 === null )
			return resMsg + "抱歉，请重新提交正确的 token" +
				`token是需要按照教程获取并替换\n` +
				`实在有问题请前往BOT官方频道反馈`;
		else {
			token = decode( token );
		}
	}
	pull( tempSubscriptionList, userID );
	//进行操作
	return await savaUserData( token, userID );
}


/* 根据SilverStar的Private Subscribe编写 */
export async function main(
	{ messageData, command, auth, sendMessage, matchResult }: InputParameter
): Promise<void> {
	
	const userID: string = messageData.msg.author.id;
	const data: string = messageData.msg.content;
	
	const header = ( <OrderMatchResult>matchResult ).header;
	const au: AuthLevel = await auth.get( userID );
	
	const SUBSCRIBE = <Order>command.getSingle( "extr-wave-yysign-enable", au );
	const YCONFIRM = <Order>command.getSingle( "extr-wave-yysign-confirm", au );
	
	if ( SUBSCRIBE.getHeaders().includes( header ) ) {
		const msg: string = await subscribe( userID, sendMessage, au, YCONFIRM );
		await sendMessage( msg );
	} else if ( YCONFIRM.getHeaders().includes( header ) ) {
		const msg: string = await confirm( userID, data, au, SUBSCRIBE );
		await sendMessage( msg );
	}
}

