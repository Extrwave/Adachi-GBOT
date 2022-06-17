import bot from "ROOT";
import { InputParameter } from "@modules/command";
import { UserInfo } from "#genshin/module/private/main";
import { privateClass } from "#genshin/init";

async function removePrivate( userID: string ): Promise<string> {
	const settings: UserInfo[] = privateClass.getUserInfoList( userID );
	if ( settings.length === 0 ) {
		return "该用户还未启用任何私人服务";
	}
	
	return privateClass.delBatchPrivate( userID );
}

async function sendMessageToUser( userID: string ) {
	const guildID = await bot.redis.getString( `adachi.guild-id` );
	const sendMessage = await bot.message.getPrivateSendFunc( guildID, userID );
	await sendMessage( "你的私人服务已被管理员取消" );
}

export async function main( { sendMessage, messageData }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	
	const msg: string = await removePrivate( userID );
	await sendMessageToUser( userID );
	await sendMessage( msg );
}