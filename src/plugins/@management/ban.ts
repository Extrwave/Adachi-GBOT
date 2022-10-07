import { AuthLevel } from "@modules/management/auth";
import { InputParameter, SwitchMatchResult } from "@modules/command";
import { idParser } from "@modules/utils";

export async function main(
	{ sendMessage, messageData, matchResult, auth, logger, config }: InputParameter
): Promise<void> {
	const match = <SwitchMatchResult>matchResult;
	const { code, target } = idParser( match.match[0] );
	const operator: string = messageData.msg.author.id;
	const guildId = messageData.msg.guild_id;
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
	
	/* 封禁 */
	if ( match.isOn() ) {
		await auth.set( operator, target, guildId, AuthLevel.Banned );
		await sendMessage( `用户 [ <@!${ target }> ] 在当前频道已被设为封禁用户` );
	}
	/* 解封 */
	else {
		await auth.set( operator, target, guildId, AuthLevel.User );
		await sendMessage( `用户 [ <@!${ target }> ] 在当前频道已解除封禁` );
	}
}