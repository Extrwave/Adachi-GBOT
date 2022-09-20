import { InputParameter } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { MysQueryService } from "#genshin/module/private/mys";
import { RenderResult } from "@modules/renderer";
import { mysInfoPromise } from "#genshin/utils/promise";
import { getPrivateAccount } from "#genshin/utils/private";
import { characterID, config, renderer } from "#genshin/init";

export async function main(
	{ sendMessage, messageData, auth, logger, redis }: InputParameter
): Promise<void> {
	const userID = messageData.msg.author.id;
	const idMsg = messageData.msg.content;
	const info: Private | string = await getPrivateAccount( userID, idMsg, auth );
	if ( typeof info === "string" ) {
		await sendMessage( info );
		return;
	}
	
	const { cookie, mysID } = info.setting;
	
	
	try {
		await mysInfoPromise( userID, mysID, cookie );
	} catch ( error ) {
		if ( error !== "gotten" ) {
			await sendMessage( <string>error );
			return;
		}
	}
	
	const appointId = info.options[MysQueryService.FixedField].appoint;
	let appointName: string = "empty";
	
	if ( appointId !== "empty" ) {
		for ( const name in characterID.map ) {
			const mapId = characterID.map[name];
			if ( mapId === parseInt( appointId ) ) {
				appointName = name;
				break;
			}
		}
	}
	
	/* 半小时内重复获取 */
	// const dbKey = `adachi-temp-mys-${ mysID }`;
	// const mysTemp = await redis.getString( dbKey );
	// if ( mysTemp !== "" ) {
	// 	await sendMessage( { image: mysTemp } );
	// 	return;
	// }
	
	await sendMessage( "获取成功，正在生成图片..." );
	const res: RenderResult = await renderer.asLocalImage(
		"/card.html", {
			qq: userID,
			style: config.cardWeaponStyle,
			profile: config.cardProfile,
			appoint: appointName
		} );
	if ( res.code === "ok" ) {
		await sendMessage( { file_image: res.data } );
		// await redis.setString( dbKey, res.data, 3600 * 0.5 );
	}else if ( res.code === "other" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}