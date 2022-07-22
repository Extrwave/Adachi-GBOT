/**
Author: Ethereal
CreateTime: 2022/6/29
 */
import { InputParameter, Order } from "@modules/command";
import { getGuildBaseInfo } from "@modules/utils/account";
import { Embed } from "qq-guild-bot";
import { AuthLevel } from "@modules/management/auth";
import { getMessageType } from "@modules/message";
import { MessageType } from "@modules/utils/message";

export async function main( { sendMessage, messageData, message, command, redis }: InputParameter ) {
	
	const content = messageData.msg.content;
	if ( content.length <= 0 ) {
		await sendMessage( "需要反馈什么呢？请带上内容 ~ " );
		return;
	}
	const name = messageData.msg.author.username;
	const userId = messageData.msg.author.id;
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
		title: '有人给你留言啦 ~ ',
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
			name: `消息：\n\n`
		}, {
			name: `${ content }\n\n`
		}, {
			name: `使用 ${ REPLY.getHeaders()[0] } 引用消息快捷回复 ~ `
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
		const gdbKey = `adachi.message-reply-guild-${ messageRes.id }`;
		if ( msgType === MessageType.Private ) {
			await redis.setHashField( dbKey, "fakeGuild", fakeGuildId );
			await redis.setHashField( dbKey, "channelId", "" );
			await redis.setHashField( dbKey, "msgId", msgId );
		} else {
			await redis.setHashField( dbKey, "fakeGuild", "" );
			await redis.setHashField( dbKey, "channelId", channelId );
			await redis.setHashField( dbKey, "msgId", msgId );
		}
		await redis.setHashField( gdbKey, "srcGuild", guildId );
		await redis.setHashField( gdbKey, "userId", userId );
		await redis.setTimeout( gdbKey, 3600 * 12 ); //主动回复限制12小时内，应该可以自己改长一点
		await redis.setTimeout( dbKey, 300 ); //被动回复5分钟有效
	} catch ( error ) {
		await sendMessage( `消息发送失败，原因：\n${ error }\n请前往BOT资料卡上官频反馈` );
		return;
	}
}