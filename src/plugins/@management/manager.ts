import { AuthLevel } from "@modules/management/auth";
import { InputParameter, SwitchMatchResult } from "@modules/command";
import idParser from "#@help/utils/id-parser";

export async function main( { sendMessage, redis, matchResult, logger }: InputParameter ): Promise<void> {
	const match = <SwitchMatchResult>matchResult;
	const isOn: boolean = match.isOn();
	
	const { code, targetID } = idParser( match.match[0] );
	if ( code === "error" ) {
		logger.error( targetID );
		await sendMessage( targetID );
	} else {
		if ( isOn ) {
			await redis.setString( `adachi.auth-level-${ targetID }`, AuthLevel.Manager );
			await sendMessage( `用户 [ <@!${ targetID }> ] 已被设置为管理员` );
		} else {
			await redis.setString( `adachi.auth-level-${ targetID }`, AuthLevel.User );
			await sendMessage( `用户 [ <@!${ targetID }> ] 的管理员权限已取消` );
		}
	}
	
	
}