import bot from "ROOT";
import { Order } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";
import { UserInfo } from "#genshin/module/private/main";
import { InputParameter } from "@modules/command";
import { privateClass } from "#genshin/init";

async function cancelPrivate( userID: string, id: number ): Promise<string> {
	const auth: AuthLevel = await bot.auth.get( userID );
	const PRIVATE_ADD = <Order>bot.command.getSingle( "silvery-star-private-subscribe", auth );
	const settings: UserInfo[] = privateClass.getUserInfoList( userID );
	if ( settings.length === 0 ) {
		return `配置尚未完成\n请私聊本BOT发送 『${ PRIVATE_ADD.getHeaders()[0] }』启用`;
	}
	return privateClass.delSinglePrivate( userID, id );
}

export async function main(
	{ sendMessage, messageData }: InputParameter
): Promise<void> {
	const id: number = parseInt( messageData.msg.content );
	const userID: string = messageData.msg.author.id;
	const msg: string = await cancelPrivate( userID, id );
	await sendMessage( msg );
}