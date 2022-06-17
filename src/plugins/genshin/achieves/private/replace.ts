import bot from "ROOT";
import { AuthLevel } from "@modules/management/auth";
import { Private } from "#genshin/module/private/main";
import { InputParameter, Order } from "@modules/command";
import { privateClass } from "#genshin/init";

export async function main(
	{ sendMessage, messageData }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const info: string[] = messageData.msg.content.split( " " );
	
	const id: number = parseInt( info[0] );
	const newCookie: string = info.slice( 1 ).join( " " );
	
	const auth: AuthLevel = await bot.auth.get( userID );
	const PRIVATE_ADD = <Order>bot.command.getSingle( "silvery-star-private-subscribe", auth );
	
	const accounts: Private[] = privateClass.getUserPrivateList( userID );
	if ( accounts.length === 0 ) {
		await sendMessage( `配置尚未完成\n请私聊本七发送 『${ PRIVATE_ADD.getHeaders()[0] }』启用` );
		return;
	} else if ( id > accounts.length || id === 0 ) {
		const PRIVATE_LIST = <Order>bot.command.getSingle(
			"silvery-star-private-list", AuthLevel.User
		);
		await sendMessage( `无效的序号，请使用 ${ PRIVATE_LIST.getHeaders()[0] } 检查，序号为前面数字，不是UID` );
		return;
	}
	const account: Private = accounts[id - 1];
	
	const reg: RegExp = /.*?ltuid=([0-9]+).*?/;
	const execRes: RegExpExecArray | null = reg.exec( newCookie );
	if ( !execRes || parseInt( execRes[1] ) !== account.setting.mysID ) {
		await sendMessage( "cookie 格式错误，或与原 cookie 对应的米游社账号不同" );
		return;
	}
	
	await account.replaceCookie( newCookie );
	await sendMessage( `cookie 更新成功` );
}