import bot from "ROOT";
import { InputParameter } from "@modules/command";
import { UserInfo } from "#genshin/module/private/main";
import { privateClass } from "#genshin/init";
import { getGidMemberIn } from "@modules/utils/account";

async function removePrivate( userID: string ): Promise<string> {
	const settings: UserInfo[] = privateClass.getUserInfoList( userID );
	if ( settings.length === 0 ) {
		return "该用户还未启用任何私人服务";
	}
	
	return privateClass.delBatchPrivate( userID );
}

async function sendMessageToUser( userID: string ) {
	//此处私发逻辑已更改
	const guildID = await getGidMemberIn( userID );
	if ( !guildID ) {
		bot.logger.error( "获取成员信息失败，检查成员是否退出频道 ID：" + userID )
		return;
	}
	const sendMessage = await bot.message.getPrivateSendFunc( guildID, userID );
	await sendMessage( "你的私人服务已被管理员取消" );
}

export async function main( { sendMessage, messageData }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	
	const msg: string = await removePrivate( userID );
	await sendMessageToUser( userID );
	await sendMessage( msg );
}