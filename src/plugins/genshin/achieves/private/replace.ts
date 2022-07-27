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
		await sendMessage(
			"此功能需要您的账户授权信息\n" +
			"授权后你将拥有以下进阶功能\n\n" +
			"树脂查询         达量推送\n" +
			"深渊查询         自动签到\n" +
			"旅行札记         角色详情\n\n" +
			"如需添加授权，请私聊本BOT发送\n" +
			`[  ${ PRIVATE_ADD.getHeaders()[0] }  ] 并按照提示完成操作` );
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