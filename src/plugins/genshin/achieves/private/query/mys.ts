import bot from "ROOT";
import { InputParameter } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { MysQueryService } from "#genshin/module/private/mys";
import { RenderResult } from "@modules/renderer";
import { mysInfoPromise } from "#genshin/utils/promise";
import { getPrivateAccount } from "#genshin/utils/private";
import { characterID, config, renderer } from "#genshin/init";
import { MessageToSend } from "@modules/message";
import { IMessage } from "qq-guild-bot";

export async function main( i: InputParameter ): Promise<void> {
	const { sendMessage, messageData } = i;
	const userID = messageData.msg.author.id;
	const idMsg = messageData.msg.content;
	
	const { code, data: appointName } = await mysQuery( userID, idMsg );
	
	if ( !code ) {
		await sendMessage( appointName );
		return;
	}
	await mysHandler( userID, appointName, sendMessage );
}

export async function mysQuery( userID: string, idMsg: string ) {
	const info: Private | string = await getPrivateAccount( userID, idMsg);
	if ( typeof info === "string" ) {
		return { code: false, data: info };
	}
	
	const { cookie, mysID } = info.setting;
	
	try {
		await mysInfoPromise( userID, mysID, cookie );
	} catch ( error ) {
		if ( error !== "gotten" ) {
			return { code: false, data: <string>error };
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
	return { code: true, data: appointName };
}

export async function mysHandler( userID: string, appointName: string, sendMessage: ( content: MessageToSend | string, atUser?: string ) => Promise<IMessage | void> ) {
	await sendMessage( "获取成功，正在生成图片..." );
	const res: RenderResult = await renderer.asLocalImage(
		"/card.html", {
			qq: userID,
			style: config.cardWeaponStyle,
			profile: config.cardProfile,
			appoint: appointName
		} );
	if ( res.code === "local" ) {
		await sendMessage( { file_image: res.data } );
	} else if ( res.code === "other" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}