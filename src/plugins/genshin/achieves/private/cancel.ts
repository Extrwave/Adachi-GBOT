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
		return "此功能需要您的账户授权信息\n" +
			"授权后你将拥有以下进阶功能\n\n" +
			"树脂查询         达量推送\n" +
			"深渊查询         自动签到\n" +
			"旅行札记         角色详情\n\n" +
			"如需添加授权，请私聊本BOT\n" +
			"发送 " + PRIVATE_ADD.getHeaders()[0] + " 并按照提示完成操作";
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