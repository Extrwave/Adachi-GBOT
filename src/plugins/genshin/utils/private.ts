import bot from "ROOT";
import { Private } from "#genshin/module/private/main";
import { Order } from "@modules/command";
import Authorization, { AuthLevel } from "@modules/management/auth";
import { privateClass } from "#genshin/init";

function parseID( msg: string ): number {
	if ( !msg ) {
		bot.logger.debug( `消息段解析调试: ${ msg }` );
		return 0;
	}
	const id: number = parseInt( msg );
	if ( !Number.isNaN( id ) ) {
		return id - 1;
	}
	bot.logger.warn( `消息段解析出现异常: ${ msg }` );
	
	const res: string[] | null = msg.match( /(\d+)/g );
	if ( res ) {
		const list: string[] = res.sort( ( x, y ) => x.length - y.length );
		return parseInt( list[0] ) - 1;
	} else {
		return 0;
	}
}

export async function getPrivateAccount( userID: string, idMsg: string, auth: Authorization ): Promise<string | Private> {
	const id: number = parseID( idMsg );
	
	const accounts: Private[] = privateClass.getUserPrivateList( userID );
	const a: AuthLevel = await auth.get( userID );
	if ( accounts.length === 0 ) {
		const PRIVATE_SUBSCRIBE = <Order>bot.command.getSingle( "silvery-star-private-subscribe", a );
		return "此功能需要您的账户授权信息\n" +
			"授权后你将拥有以下进阶功能\n\n" +
			"树脂查询         达量推送\n" +
			"深渊查询         自动签到\n" +
			"旅行札记                \n\n" +
			"如需添加授权，请私聊本BOT\n" +
			"发送 " + PRIVATE_SUBSCRIBE.getHeaders()[0] + "并按照提示完成操作";
	} else if ( accounts.length - 1 < id || id === -1 ) {
		const PRIVATE_LIST = <Order>bot.command.getSingle( "silvery-star-private-list", a );
		return `无效的序号，请使用 ${ PRIVATE_LIST.getHeaders()[0] } 检查，序号为前面数字，不是UID`;
	}
	
	return accounts[id];
}