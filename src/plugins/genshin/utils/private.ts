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
		return `配置尚未完成\n请私聊本BOT发送『${ PRIVATE_SUBSCRIBE.getHeaders()[0] }』启用`;
	} else if ( accounts.length - 1 < id || id === -1 ) {
		const PRIVATE_LIST = <Order>bot.command.getSingle( "silvery-star-private-list", a );
		return `无效的序号，请使用 ${ PRIVATE_LIST.getHeaders()[0] } 检查，序号为前面数字，不是UID`;
	}
	
	return accounts[id];
}