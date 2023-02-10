import Database from "@modules/redis";
import { RenderResult } from "@modules/renderer";
import { config, renderer } from "#genshin/init";
import { getRegion } from "#genshin/utils/region";
import { InputParameter } from "@modules/command";
import { mysHandler, mysQuery } from "#genshin/achieves/private/query/mys";
import { characterInfoPromise, detailInfoPromise } from "#genshin/utils/promise";

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

export async function main( i: InputParameter ): Promise<void> {
	
	const { sendMessage, messageData, redis, auth } = i;
	const data: string = messageData.msg.content;
	const atID: string | undefined = isAt( data );
	const userID: string = messageData.msg.author.id;
	
	const { info, stranger } = await getUID( data, userID, redis, atID );
	if ( typeof info === "string" ) {
		await sendMessage( info );
		return;
	}
	
	//判断UID查询对象是否开启了私人服务，开启了就直接查询mys
	if ( !stranger ) {
		const { code, data: appointName } = await mysQuery( atID ? atID : userID, info.toString() );
		if ( code ) {
			await mysHandler( atID ? atID : userID, appointName, sendMessage );
			return;
		}
	}
	
	const uid: number = info;
	const server: string = getRegion( uid.toString()[0] );
	const target: string = atID ? atID : userID;
	
	try {
		//此处个人信息获取逻辑已更改
		await redis.setHash( `silvery-star.card-data-${ uid }`, { uid } );
		await redis.setString( `silvery-star.user-querying-id-${ target }`, uid );
		
		const charIDs = <number[]>await detailInfoPromise( target, server );
		await characterInfoPromise( target, server, charIDs );
	} catch ( error ) {
		if ( error !== "gotten" ) {
			await sendMessage( <string>error );
			return;
		}
	}
	await sendMessage( "获取成功，正在生成图片..." );
	const res: RenderResult = await renderer.asLocalImage(
		"/user-base.html", {
			qq: target, stranger,
			style: config.cardWeaponStyle,
			profile: config.cardProfile
		}
	);
	if ( res.code === "local" ) {
		await sendMessage( { file_image: res.data } );
	} else if ( res.code === "other" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}