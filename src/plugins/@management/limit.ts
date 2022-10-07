import { InputParameter, SwitchMatchResult } from "@modules/command";
import { idParser } from "@modules/utils";

export async function main(
	{
		sendMessage,
		matchResult,
		redis,
		logger,
		messageData,
		auth,
	}: InputParameter ): Promise<void> {
	const match = <SwitchMatchResult>matchResult;
	const states: string = match.isOn() ? "开启" : "关闭";
	const operator: string = messageData.msg.author.id;
	const guildId = messageData.msg.guild_id;
	
	const [ id, key ] = match.match;
	const { code, target } = idParser( id );
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
	
	const dbKey = `adachi.user-command-limit-${ target }-${ guildId }`;
	const reply = `用户 [ <@!${ target }> ] 的 ${ key } 权限在此频道已${ states }`;
	if ( match.isOn() ) {
		await redis.delSetMember( dbKey, key );
	} else {
		await redis.addSetMember( dbKey, key );
	}
	await sendMessage( reply );
}