import { AuthLevel } from "@modules/management/auth";
import { InputParameter, SwitchMatchResult } from "@modules/command";
import { idParser } from "@modules/utils";

/**
 * @Master 只控制所有用户的全局管理设置
 * @GuildOwner 控制自己频道的频道管理员设置以及往下兼容权限
 * @GuildManager 控制当前频道的 User ban limit 权限
 * @User 不能进行任何权限操作
 */


export async function main(
	{
		sendMessage,
		auth,
		matchResult,
		logger,
		config,
		messageData
	}: InputParameter ): Promise<void> {
	const match = <SwitchMatchResult>matchResult;
	const isOn: boolean = match.isOn();
	const guildId = messageData.msg.guild_id;
	const operator = messageData.msg.author.id;
	/* 获取@对象识别 */
	const { code, target } = idParser( match.match[0] );
	if ( code === "error" ) {
		logger.error( target );
		await sendMessage( target );
		return;
	}
	
	const check = await auth.opCheck( operator, target, guildId );
	if ( typeof check === 'string' ) {
		await sendMessage( check );
		return;
	}
	
	if ( isOn ) {
		await auth.set( operator, target, guildId, AuthLevel.Manager );
		await sendMessage( `用户 [ <@!${ target }> ] 已被设置为${ operator === config.master ? "全局" : "频道" }管理员` );
	} else {
		await auth.set( operator, target, guildId, AuthLevel.User );
		await sendMessage( `用户 [ <@!${ target }> ] 的${ operator === config.master ? "全局" : "频道" }管理员已取消` );
	}
}