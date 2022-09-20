import bot from "ROOT";
import { AuthLevel } from "@modules/management/auth";
import { Private } from "#genshin/module/private/main";
import { NoteService } from "#genshin/module/private/note";
import { InputParameter, Order } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { privateClass, renderer } from "#genshin/init";


async function getNowNote( userID: string ): Promise<RenderResult[]> {
	const accounts: Private[] = privateClass.getUserPrivateList( userID );
	const auth: AuthLevel = await bot.auth.get( userID );
	const PRIVATE_ADD = <Order>bot.command.getSingle( "silvery-star-private-subscribe", auth );
	if ( accounts.length === 0 ) {
		return [ {
			code: "other", data: "此功能需要您的账户授权信息\n" +
				"授权后你将拥有以下进阶功能\n\n" +
				"树脂查询         达量推送\n" +
				"深渊查询         自动签到\n" +
				"旅行札记         角色详情\n\n" +
				"如需添加授权，请私聊本BOT发送\n" +
				`[  ${ PRIVATE_ADD.getHeaders()[0] }  ] 并按照提示完成操作`
		} ];
	}
	
	const imageList: RenderResult[] = [];
	for ( let a of accounts ) {
		let data: string;
		try {
			data = await a.services[NoteService.FixedField].toJSON();
		} catch ( error ) {
			imageList.push( { code: "other", data: ( <Error>error ).message } );
			continue;
		}
		const uid: string = a.setting.uid;
		const dbKey: string = `silvery-star.note-temp-${ uid }`;
		await bot.redis.setString( dbKey, data );
		const res: RenderResult = await renderer.asLocalImage(
			"/note.html", { uid }
		);
		if ( res.code === "ok" ) {
			imageList.push( { code: "ok", data: res.data } );
		} else if ( res.code === "other" ) {
			imageList.push( { code: "other", data: res.data } );
		} else {
			imageList.push( { code: "error", data: res.data } );
		}
	}
	return imageList;
}

export async function main( { sendMessage, messageData }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const res: RenderResult[] = await getNowNote( userID );
	
	for ( let msg of res ) {
		if ( msg.code === "ok" )
			// await sendMessage( { image: msg.data } );
			await sendMessage( { file_image: msg.data } )
		else if ( msg.code === "other" ) {
			await sendMessage( { image: msg.data } );
		} else {
			await sendMessage( msg.data );
		}
	}
}