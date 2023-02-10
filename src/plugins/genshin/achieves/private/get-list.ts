import bot from "ROOT";
import { AuthLevel } from "@modules/management/auth";
import { UserInfo } from "#genshin/module/private/main";
import { InputParameter, Order } from "@modules/command";
import { privateClass } from "#genshin/init";

async function getPrivateList( userID: string ): Promise<string> {
	const settings: UserInfo[] = privateClass.getUserInfoList( userID );
	const PRIVATE_ADD = <Order>bot.command.getSingle( "silvery-star-private-subscribe", AuthLevel.Master );
	if ( settings.length === 0 ) {
		return "此功能需要您的账户授权信息\n" +
			"授权后你将拥有以下进阶功能\n\n" +
			"便筏查询         树脂提醒\n" +
			"派遣提醒         宝钱提醒\n" +
			"深渊查询         旅行札记\n" +
			"质变仪提醒    详细主页查询\n\n" +
			"如需添加授权，请私聊发送\n" +
			`[  ${ PRIVATE_ADD.getHeaders()[0] }  ] 并按照提示完成操作`;
	}
	
	const str: string[] = [];
	const num: number = settings.length;
	for ( let i = 0; i < num; i++ ) {
		const uid: string = settings[i].uid;
		str.push( `[ ${ i + 1 } ] - UID${ uid }` );
	}
	
	return "当前完成配置的账号：\n" +
		[ "", ...str ].join( "\n  " );
}

export async function main(
	{ sendMessage, messageData }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const msg: string = await getPrivateList( userID );
	await sendMessage( msg );
}