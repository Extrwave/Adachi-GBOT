import { AuthLevel } from "@modules/management/auth";
import { InputParameter, SwitchMatchResult } from "@modules/command";

export async function main(
	{ sendMessage, messageData, matchResult, redis, auth, logger }: InputParameter
): Promise<void> {
	const match = <SwitchMatchResult>matchResult;
	const atUser: string = match.match[0]; //匹配到的@用户信息
	const result = atUser.match( /<@!(.*)>/ );
	let targetID;
	if ( result === null ) {
		logger.error( "用户匹配出错." );
		await sendMessage( "用户匹配出错." );
	} else {
		targetID = result[1];
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