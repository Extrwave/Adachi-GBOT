import Database from "@modules/database";
import { InputParameter } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { characterInfoPromise, detailInfoPromise } from "../utils/promise";
import { getRegion } from "../utils/region";
import { config, renderer } from "#genshin/init";

interface UIDResult {
	info: number | string;
	stranger: boolean;
}

function isAt( message: string ): string | undefined {
	const res: RegExpExecArray | null = /<@!(?<id>\d+)/.exec( message );
	return res?.groups?.id;
}

async function getUID(
	data: string, userID: string, redis: Database, atID?: string
): Promise<UIDResult> {
	if ( data === "" ) {
		const uid: string = await redis.getString( `silvery-star.user-bind-uid-${ userID }` );
		const info = uid.length === 0 ? "您还未绑定游戏UID" : parseInt( uid );
		return { info, stranger: false };
	} else if ( atID ) {
		const uid: string = await redis.getString( `silvery-star.user-bind-uid-${ atID }` );
		const info = uid.length === 0 ? `用户 ${ atID } 未绑定游戏UID` : parseInt( uid );
		return { info, stranger: false };
	} else {
		return { info: parseInt( data ), stranger: true };
	}
}

export async function main(
	{ sendMessage, messageData, redis, logger, client }: InputParameter
): Promise<void> {
	
	
	const data: string = messageData.msg.content;
	const atID: string | undefined = isAt( data );
	const userID: string = messageData.msg.author.id;
	
	const { info, stranger } = await getUID( data, userID, redis, atID );
	if ( typeof info === "string" ) {
		await sendMessage( info );
		return;
	}
	
	const uid: number = info;
	const server: string = getRegion( uid.toString()[0] );
	const target: string = atID ? atID : userID;
	
	try {
		const targetInfo = await client.guildApi.guildMember( await redis.getString( `adachi.guild-id` ), target );
		const nickname: string = targetInfo.status === 200
			? targetInfo.data.user.username : "";
		await redis.setHash( `silvery-star.card-data-${ uid }`, {
			nickname, uid, level: 0
		} );
		await redis.setString( `silvery-star.user-querying-id-${ target }`, uid );
		
		const charIDs = <number[]>await detailInfoPromise( target, server );
		await characterInfoPromise( target, server, charIDs );
	} catch ( error ) {
		if ( error !== "gotten" ) {
			await sendMessage( <string>error );
			return;
		}
	}
	
	await sendMessage( "获取成功，七七努力画图中..." );
	const res: RenderResult = await renderer.asUrlImage(
		"/user-base.html", {
			qq: target, stranger,
			style: config.cardWeaponStyle,
			profile: config.cardProfile
		}
	);
	if ( res.code === "ok" ) {
		await sendMessage( { image: res.data } );
	} else if ( res.code === "error" ) {
		await sendMessage( res.error );
	} else {
		logger.error( res.err );
		await sendMessage( "图片渲染异常，请联系持有者进行反馈" );
	}
}