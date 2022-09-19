import { InputParameter, SwitchMatchResult } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { Abyss } from "#genshin/types";
import { RenderResult } from "@modules/renderer";
import { getPrivateAccount } from "#genshin/utils/private";
import { getRegion } from "#genshin/utils/region";
import { abyssInfoPromise } from "#genshin/utils/promise";
import { renderer } from "#genshin/init";

/* 回复深渊单图消息 */
async function singleAchieves( abyss: Abyss, uid: string, userID: string, {
	redis,
	logger,
	sendMessage,
	messageData
}: InputParameter ) {
	
	
	await redis.setHash( `silvery-star.abyss-temp-${ userID }-single`, {
		uid,
		userName: messageData.msg.author.username,
		revealRank: JSON.stringify( abyss.revealRank ),
		defeatRank: JSON.stringify( abyss.defeatRank ),
		takeDamageRank: JSON.stringify( abyss.takeDamageRank ),
		normalSkillRank: JSON.stringify( abyss.normalSkillRank ),
		energySkillRank: JSON.stringify( abyss.energySkillRank ),
		damageRank: JSON.stringify( abyss.damageRank ),
		maxFloor: abyss.maxFloor,
		totalBattleTimes: abyss.totalBattleTimes,
		totalStar: abyss.totalStar,
		floors: JSON.stringify( abyss.floors )
	} );
	
	
	const res: RenderResult = await renderer.asUrlImage(
		"/abyss-single.html", { qq: userID }
	);
	if ( res.code === "ok" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.error );
	}
}

export async function main( i: InputParameter ): Promise<void> {
	const { sendMessage, messageData, matchResult, auth, redis } = i;
	
	const match = <SwitchMatchResult>matchResult;
	const userID: string = messageData.msg.author.id;
	
	const data: string = match.match.filter( m => m !== "-l" )[0] ?? "";
	
	const info: Private | string = await getPrivateAccount( userID, data, auth );
	if ( typeof info === "string" ) {
		await sendMessage( info );
		return;
	}
	
	const { uid, cookie } = info.setting;
	const server: string = getRegion( uid[0] );
	const period: number = match.isOn() ? 1 : 2;
	try {
		await redis.setString( `silvery-star.abyss-querying-${ userID }`, uid );
		await abyssInfoPromise( userID, server, period, cookie );
	} catch ( error ) {
		if ( error !== "gotten" ) {
			await sendMessage( <string>error );
			return;
		}
	}
	
	const abyssData: string = await redis.getString( `silvery-star.abyss-data-${ uid }` );
	
	if ( abyssData.length === 0 ) {
		await sendMessage( "查询错误" );
		return;
	}
	const abyss: Abyss = JSON.parse( abyssData );
	
	if ( !abyss.floors || abyss.floors.length === 0 ) {
		await sendMessage( "暂未查询到深渊数据" );
		return;
	}
	await singleAchieves( abyss, uid, userID, i );
}