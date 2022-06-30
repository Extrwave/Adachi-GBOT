/**
Author: Ethereal
CreateTime: 2022/6/30
 */

import { InputParameter } from "@modules/command";

interface ReplyBase {
	type: string,
	msgId: string,
	content: string
}

interface ReplyPrivate extends ReplyBase {
	guildId: string
}

interface ReplyGuild extends ReplyBase {
	channelId: string
}

export async function main( { sendMessage, messageData, message, redis }: InputParameter ) {
	const content = messageData.msg.content; //消息内容
	const Params: string[] = content.split( " " );
	const regExp: RegExp = /(private|guild)(.+)\s/i;
	const rawContent = content.replace( regExp, "" ).trim();
	try {
		if ( Params[0] === "private" ) {
			const Msg: ReplyPrivate = { type: Params[0], guildId: Params[1], msgId: Params[2], content: rawContent };
			const sendToUser = message.sendPrivateMessage( Msg.guildId, Msg.msgId );
			await sendToUser( Msg.content );
		} else {
			const Msg: ReplyGuild = { type: Params[0], channelId: Params[1], msgId: Params[2], content: rawContent };
			const sendToUser = message.sendGuildMessage( Msg.channelId, Msg.msgId );
			await sendToUser( "Master：" + Msg.content );
		}
	} catch ( error ) {
		await sendMessage( "消息发送失败，或者已超过五分钟" );
	}
}