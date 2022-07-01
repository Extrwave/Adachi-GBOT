/**
Author: Ethereal
CreateTime: 2022/6/29
 */
import { InputParameter, Order } from "@modules/command";
import { getGuildBaseInfo } from "@modules/utils/account";
import { Embed, IMessageRes } from "qq-guild-bot";
import { AuthLevel } from "@modules/management/auth";
import { getMessageType } from "@modules/message";
import { MessageType } from "@modules/utils/message";

export async function main( { sendMessage, messageData, message, command, redis }: InputParameter ) {
	
	const content = messageData.msg.content;
	const userId = messageData.msg.author.id;
	const name = messageData.msg.author.username;
	const avatar = messageData.msg.author.avatar;
	const msgType: MessageType = getMessageType( messageData ); //获取消息类型
	const type = msgType === MessageType.Private ? "私聊" : "频道";
	const guildId = messageData.msg.src_guild_id ? messageData.msg.src_guild_id : messageData.msg.guild_id;
	const fakeGuildId = messageData.msg.guild_id;
	const channelId = messageData.msg.channel_id;
	const msgId = messageData.msg.id;
	
	/* 获取发送给Master的方法 ~ */
	const sendMasterFunc = await message.sendToMaster( msgId );
	const guildInfo = await getGuildBaseInfo( guildId );
	const REPLY = <Order>command.getSingle( `adachi-reply-user`, AuthLevel.Master );
	
	const embedMsg: Embed = {
		title: '收到给Master的消息',
		prompt: '频道反馈消息',
		thumbnail: {
			url: avatar,
		},
		fields: [ {
			name: `用户：${ name }`
		}, {
			name: `频道：${ guildInfo?.name }`
		}, {
			name: `方式：${ type }`
		}, {
			name: `消息：\n`
		}, {
			name: `${ content }`
		}, {
			name: "\n"
		}, {
			name: `使用 ${ REPLY.getHeaders()[0] } 引用消息快捷回复 ~ `
		}, {
			name: "快捷回复仅在五分钟内有效 ~ "
		} ]
	};
	try {
		await sendMasterFunc( { embed: embedMsg } );
		const messageRes = await sendMasterFunc( `引用此消息回复：[ ${ name } ]` );
		await sendMessage( `已将消息发送给Master啦 ~ ` );
		if ( !messageRes || !messageRes.id ) {
			throw new Error( "发送消息返回对象异常" );
		}
		const dbKey = `adachi.message-reply-id-${ messageRes.id }`;
		if ( msgType === MessageType.Private ) {
			await redis.setHashField( dbKey, "fakeGuild", fakeGuildId );
			await redis.setHashField( dbKey, "channelId", "" );
			await redis.setHashField( dbKey, "msgId", msgId );
		} else {
			await redis.setHashField( dbKey, "fakeGuild", "" );
			await redis.setHashField( dbKey, "channelId", channelId );
			await redis.setHashField( dbKey, "msgId", msgId );
		}
		await redis.setTimeout( dbKey, 300 );
	} catch ( error ) {
		await sendMessage( `消息发送失败，原因：\n${ error }\n请前往BOT资料卡上官频反馈` );
		return;
	}
}