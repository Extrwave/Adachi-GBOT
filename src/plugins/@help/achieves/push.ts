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
	} catch ( error ) {
		await sendMessage( "消息发送失败" );
		await sendMessage( JSON.stringify( error ) );
	}
	await sendMessage( "快去私信查看吧 ~ " );
}