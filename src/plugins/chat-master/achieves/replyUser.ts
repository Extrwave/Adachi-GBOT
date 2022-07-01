/**
Author: Ethereal
CreateTime: 2022/6/30
 */
import { InputParameter } from "@modules/command";
import { MessageToCreate } from "qq-guild-bot";


export async function main( { sendMessage, messageData, message, redis }: InputParameter ) {
	const rawContent: string = "Master：" + messageData.msg.content;
	const msgRefId = messageData.msg.message_reference?.message_id;
	if ( !msgRefId ) {
		await sendMessage( "请引用需要回复的消息" );
		return;
	}
	const dbKey = `adachi.message-reply-id-${ msgRefId }`;
	const fakeGuildId = await redis.getHashField( dbKey, "fakeGuild" );
	const channelId = await redis.getHashField( dbKey, "channelId" );
	const msgId = await redis.getHashField( dbKey, "msgId" );
	if ( msgId === "" ) {
		await sendMessage( "消息ID已经过期，无法回复了哦~" );
		return;
	}
	const content: MessageToCreate = {
		content: rawContent,
		message_reference: {
			message_id: msgId,
			ignore_get_message_error: true
		}
	}
	try {
		if ( fakeGuildId !== "" ) {
			//首先处理私聊信息回复逻辑
			const sendToUser = message.sendPrivateMessage( fakeGuildId, msgId );
			await sendToUser( content );
		} else if ( channelId !== "" ) {
			const sendToUser = message.sendGuildMessage( channelId, msgId );
			await sendToUser( content );
		}
	} catch ( error ) {
		await sendMessage( `未知错误：${ <Error>error }` );
	}
}