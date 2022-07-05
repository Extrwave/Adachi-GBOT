/**
Author: Ethereal
CreateTime: 2022/6/30
 */
import { InputParameter } from "@modules/command";
import { MessageToCreate } from "qq-guild-bot";
import { ErrorMsg } from "@modules/utils/message";


export async function main( { sendMessage, messageData, message, redis }: InputParameter ) {
	const rawContent: string = "Master：" + messageData.msg.content;
	const msgRefId = messageData.msg.message_reference?.message_id;
	if ( !msgRefId ) {
		await sendMessage( "请引用需要回复的消息" );
		return;
	}
	const dbKey = `adachi.message-reply-id-${ msgRefId }`;
	const gdbKey = `adachi.message-reply-guild-${ msgRefId }`;
	const fakeGuildId = await redis.getHashField( dbKey, "fakeGuild" );
	const channelId = await redis.getHashField( dbKey, "channelId" );
	const msgId = await redis.getHashField( dbKey, "msgId" );
	const guildId = await redis.getHashField( gdbKey, "srcGuild" );
	const userId = await redis.getHashField( gdbKey, "userId" );
	if ( msgId === "" && userId === "" ) {
		await sendMessage( "消息太久远，无法回复了哦~" );
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
		} else {
			//消息ID已超过五分钟，采用主动推送发送，有些频道无法主动推送，所以先暂时采用私聊推送
			const sendToUser = await message.getPrivateSendFunc( guildId, userId );
			content.message_reference = undefined;
			await sendToUser( content );
		}
	} catch ( error ) {
		const err = <ErrorMsg>error;
		await sendMessage( err.message );
	}
}