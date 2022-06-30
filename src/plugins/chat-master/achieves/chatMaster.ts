/**
Author: Ethereal
CreateTime: 2022/6/29
 */
import { InputParameter, Order } from "@modules/command";
import { getGuildBaseInfo } from "@modules/utils/account";
import { Embed } from "qq-guild-bot";
import { AuthLevel } from "@modules/management/auth";
import { getMessageType, MessageType } from "@modules/message";

export async function main( { sendMessage, messageData, message, auth, command }: InputParameter ) {
	
	const content = messageData.msg.content;
	const userId = messageData.msg.author.id;
	const name = messageData.msg.author.username;
	const avatar = messageData.msg.author.avatar;
	const msgType: MessageType = getMessageType( messageData ); //获取消息类型
	const type = msgType === MessageType.Private ? "私聊" : "频道";
	const guildId = messageData.msg.src_guild_id ? messageData.msg.src_guild_id : messageData.msg.guild_id;
	const fakeGuildId = messageData.msg.src_guild_id;
	const channelId = messageData.msg.channel_id;
	const msgId = messageData.msg.id;
	/* 获取发送给Master的方法 ~ */
	const sendMasterFunc = await message.sendToMaster( msgId );
	const guildInfo = await getGuildBaseInfo( guildId );
	
	const a: AuthLevel = await auth.get( userId );
	const REPLY = <Order>command.getSingle( `adachi-reply-user`, a );
	
	
	const embedMsg: Embed = {
		title: '收到给Master的消息',
		prompt: '消息通知',
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
			name: `消息：${ content }`
		}, {
			name: "\n"
		}, {
			name: "复制下面消息 并添加内容 回复吧 ~ "
		}, {
			name: "快捷回复仅在五分钟内有效哦 ~ "
		} ]
	};
	let contentMsg = "";
	if ( msgType === MessageType.Private ) {
		contentMsg = `${ REPLY.getHeaders()[0] } private ${ fakeGuildId } ${ msgId }\n`
	} else {
		contentMsg = `${ REPLY.getHeaders()[0] } guild ${ channelId } ${ msgId }\n`
	}
	await sendMasterFunc( { embed: embedMsg } );
	await sendMasterFunc( contentMsg );
	await sendMessage( `已将消息发送给Master啦 ~ ` );
	
}