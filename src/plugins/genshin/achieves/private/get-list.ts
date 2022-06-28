import bot from "ROOT";
import { AuthLevel } from "@modules/management/auth";
import { UserInfo } from "#genshin/module/private/main";
import { InputParameter, Order } from "@modules/command";
import { privateClass } from "#genshin/init";

async function getPrivateList( userID: string ): Promise<string> {
	const settings: UserInfo[] = privateClass.getUserInfoList( userID );
	const auth: AuthLevel = await bot.auth.get( userID );
	const PRIVATE_ADD = <Order>bot.command.getSingle( "silvery-star-private-subscribe", auth );
	if ( settings.length === 0 ) {
		return `账户授权尚未完成\n如需使用，请私聊本BOT发送 ${ PRIVATE_ADD.getHeaders()[0] } `;
	}
	
	const str: string[] = [];
	const num: number = settings.length;
	for ( let i = 0; i < num; i++ ) {
		const uid: string = settings[i].uid;
		str.push( `${ i + 1 }. UID${ uid }` );
	}
	
	return "当前完成配置的账号：\n" +
		"是前面序号，别搞错不是UID" +
		[ "", ...str ].join( "\n  " );
}

export async function main(
	{ sendMessage, messageData }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const msg: string = await getPrivateList( userID );
	await sendMessage( msg );
}