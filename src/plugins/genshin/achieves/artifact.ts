import { InputParameter } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { artClass, renderer } from "../init";
import { scheduleJob } from "node-schedule";

const artLimitID: Set<string> = new Set<string>();

scheduleJob( "0 0 */1 * * *", async () => {
	artLimitID.clear();
} );

export async function main(
	{ sendMessage, messageData, redis, logger }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const domain: number = messageData.msg.content.length
		? parseInt( messageData.msg.content ) - 1 : -1;
	const reason: string = await artClass.get( userID, domain, redis );
	
	const artHourLimit = 20;
	const dbKey = `adachi.user-art-limit-${ userID }`;
	let currentCount = await redis.getString( dbKey );
	/* 用户在特定时间内超过阈值 */
	if ( currentCount === "" ) {
		await redis.setString( dbKey, 0, 3600 );
	} else if ( parseInt( currentCount ) >= artHourLimit ) {
		artLimitID.add( userID );
		await redis.deleteKey( dbKey );
	}
	
	if ( artLimitID.has( userID ) ) {
		await sendMessage( `劳逸结合是很不错 ~ \n限制 ${ artHourLimit } 次刷本/每小时 ，下个小时再试吧` );
		return;
	}
	await redis.incKey( dbKey, 1 );
	
	if ( reason !== "" ) {
		await sendMessage( reason );
		return;
	}
	const res: RenderResult = await renderer.asLocalImage(
		"/artifact.html",
		{ qq: userID, type: "init" }
	);
	if ( res.code === "ok" ) {
		await sendMessage( { file_image: res.data } );
	} else if ( res.code === "other" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}