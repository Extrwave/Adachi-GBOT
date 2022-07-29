import { InputParameter } from "@modules/command";

/**
Author: Ethereal
CreateTime: 2022/7/28
 */
export async function main( { sendMessage, messageData, message }: InputParameter ) {
	const userId = messageData.msg.author.id;
	const msgId = messageData.msg.id;
	const guildId = messageData.msg.guild_id;
	
	const pushMessage = await message.getSendPrivateFunc( guildId, userId, msgId );
	try {
		await pushMessage( "嗨，欢迎光临牛杂小店 ~ " );
		await sendMessage( "消息发送成功，去私信看看吧 ~ " );
	} catch ( error ) {
		await sendMessage( `消息发送失败：\n${ JSON.stringify( error ) }\n请注意当前频道私信限制` );
	}
}