import bot from "ROOT";
import { AuthLevel } from "@modules/management/auth";
import { Private } from "#genshin/module/private/main";
import { NoteService } from "#genshin/module/private/note";
import { InputParameter, Order } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { privateClass, renderer } from "#genshin/init";
import { SendMsgType } from "@modules/utils/message";


async function getNowNote( userID: string ): Promise<SendMsgType[]> {
	const accounts: Private[] = privateClass.getUserPrivateList( userID );
	const auth: AuthLevel = await bot.auth.get( userID );
	const PRIVATE_ADD = <Order>bot.command.getSingle( "silvery-star-private-subscribe", auth );
	if ( accounts.length === 0 ) {
		return [ {
			code: "msg", data: "此功能需要您的账户授权信息\n" +
				"授权后你将拥有以下进阶功能\n\n" +
				"树脂查询         达量推送\n" +
				"深渊查询         自动签到\n" +
				"旅行札记         角色详情\n\n" +
				"如需添加授权，请私聊本BOT发送\n" +
				`[  ${ PRIVATE_ADD.getHeaders()[0] }  ] 并按照提示完成操作`
		} ];
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
		} else {
			bot.logger.error( res.error );
			imageList.push( { code: "msg", data: "图片渲染异常，请联系开发者进行反馈\n" + res.error } );
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