import bot from "ROOT";
import { AuthLevel } from "@modules/management/auth";
import { Private } from "#genshin/module/private/main";
import { NoteService } from "#genshin/module/private/note";
import { InputParameter, Order } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { privateClass, renderer } from "#genshin/init";
import { SendMsgType } from "@modules/message";


async function getNowNote( userID: string ): Promise<SendMsgType[]> {
	const accounts: Private[] = privateClass.getUserPrivateList( userID );
	const auth: AuthLevel = await bot.auth.get( userID );
	const PRIVATE_ADD = <Order>bot.command.getSingle( "silvery-star-private-subscribe", auth );
	if ( accounts.length === 0 ) {
		return [ { code: "msg", data: `配置尚未完成\n请私聊本BOT发送 『${ PRIVATE_ADD.getHeaders()[0] }』启用` } ];
	}
	
	const imageList: SendMsgType[] = [];
	for ( let a of accounts ) {
		const data: string = await a.services[NoteService.FixedField].toJSON();
		const uid: string = a.setting.uid;
		const dbKey: string = `silvery-star.note-temp-${ uid }`;
		await bot.redis.setString( dbKey, data );
		const res: RenderResult = await renderer.asUrlImage(
			"/note.html", { uid }
		);
		if ( res.code === "ok" ) {
			imageList.push( { code: "image", data: res.data } );
		} else if ( res.code === "error" ) {
			imageList.push( { code: "msg", data: res.error } );
		} else {
			bot.logger.error( res.err );
			imageList.push( { code: "msg", data: "图片渲染异常，请联系持有者进行反馈" } );
		}
	}
	return imageList;
}

export async function main( { sendMessage, messageData }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const res: SendMsgType[] = await getNowNote( userID );
	
	for ( let msg of res ) {
		if ( msg.code === "image" )
			await sendMessage( { image: msg.data } );
		else
			await sendMessage( msg.data );
	}
}