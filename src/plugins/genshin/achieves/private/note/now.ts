import bot from "ROOT";
import { AuthLevel } from "@modules/management/auth";
import { Private } from "#genshin/module/private/main";
import { NoteService } from "#genshin/module/private/note";
import { InputParameter, Order } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { privateClass, renderer } from "#genshin/init";

async function getNowNote( userID: string ): Promise<string[]> {
	const accounts: Private[] = privateClass.getUserPrivateList( userID );
	const auth: AuthLevel = await bot.auth.get( userID );
	const PRIVATE_ADD = <Order>bot.command.getSingle( "silvery-star-private-subscribe", auth );
	if ( accounts.length === 0 ) {
		return [ `配置尚未完成\n请私聊本七发送 『${ PRIVATE_ADD.getHeaders()[0] }』启用` ];
	}
	
	const imageList: string[] = [];
	for ( let a of accounts ) {
		const data: string = await a.services[NoteService.FixedField].toJSON();
		const uid: string = a.setting.uid;
		const dbKey: string = `silvery-star.note-temp-${ uid }`;
		await bot.redis.setString( dbKey, data );
		const res: RenderResult = await renderer.asUrlImage(
			"/note.html", { uid }
		);
		if ( res.code === "ok" ) {
			imageList.push( res.data );
		} else {
			bot.logger.error( res.error );
			imageList.push( "图片渲染异常，请联系持有者进行反馈" );
		}
	}
	return imageList;
}

export async function main( { sendMessage, messageData }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const res: string[] = await getNowNote( userID );
	
	for ( let msg of res ) {
		await sendMessage( { image: msg } );
	}
}