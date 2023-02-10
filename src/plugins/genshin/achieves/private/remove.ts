import bot from "ROOT";
import { InputParameter, SwitchMatchResult } from "@modules/command";
import { UserInfo } from "#genshin/module/private/main";
import { privateClass } from "#genshin/init";
import { getMemberInfo } from "@modules/utils/account";
import { idParser } from "@modules/utils";

async function removePrivate( userID: string ): Promise<string> {
	const settings: UserInfo[] = privateClass.getUserInfoList( userID );
	if ( settings.length === 0 ) {
		return "该用户还未启用任何授权服务";
	}
	
	return privateClass.delBatchPrivate( userID );
}

async function sendMessageToUser( userID: string ) {
	//此处私发逻辑已更改
	const info = await getMemberInfo( userID );
	if ( !info ) {
		bot.logger.error( "获取成员信息失败，检查成员是否退出频道 ID：" + userID )
		return;
	}
	const sendMessage = await bot.message.getSendPrivateFunc( userID, info.guildId );
	await sendMessage( "你的授权服务已被管理员取消" );
}

export async function main( { sendMessage, matchResult, logger }: InputParameter ): Promise<void> {
	
	const match = <SwitchMatchResult>matchResult;
	const { code, target } = idParser( match.match[0] );
	if ( code === "error" ) {
		logger.error( target );
		await sendMessage( target );
	} else {
		const msg: string = await removePrivate( target );
		await sendMessageToUser( target );
		await sendMessage( msg );
	}
}