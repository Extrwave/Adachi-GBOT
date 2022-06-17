import { AuthLevel } from "@modules/management/auth";
import { InputParameter, SwitchMatchResult } from "@modules/command";
import idParser from "#@help/utils/id-parser";

export async function main(
	{ sendMessage, messageData, matchResult, redis, auth, logger }: InputParameter
): Promise<void> {
	const match = <SwitchMatchResult>matchResult;
	const { code, targetID } = idParser( match.match[0] );
	if ( code === "error" ) {
		logger.error( targetID );
		await sendMessage( targetID );
	} else {
		const targetAuth: AuthLevel = await auth.get( targetID );
		const mineAuth: AuthLevel = await auth.get( messageData.msg.author.id );
		/* 封禁 */
		if ( match.isOn() ) {
			if ( targetAuth >= mineAuth ) {
				await sendMessage( `你没有封禁用户 ${ targetID } 的权限` );
			} else {
				await redis.setString( `adachi.auth-level-${ targetID }`, AuthLevel.Banned );
				await sendMessage( `用户 ${ targetID } 已被设为封禁用户` );
			}
		}
		/* 解封 */
		else {
			if ( targetAuth >= mineAuth ) {
				await sendMessage( `你没有解禁用户 ${ targetID } 的权限` );
			} else {
				await redis.setString( `adachi.auth-level-${ targetID }`, AuthLevel.User );
				await sendMessage( `用户 ${ targetID } 已被解封` );
			}
		}
	}
}