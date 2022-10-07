import { InputParameter, Order, OrderMatchResult } from "@modules/command";
import { Embed, MessageToCreate } from "qq-guild-bot";
import { ErrorMsg, MessageType } from "@modules/utils/message";
import { AuthLevel } from "@modules/management/auth";
import { getMessageType, SendFunc } from "@modules/message";
import { getGuildBaseInfo } from "@modules/utils/account";
import { EmbedMsg } from "@modules/utils/embed";

/**
Author: Ethereal
CreateTime: 2022/7/25
 */
export async function main(
	{ sendMessage, messageData, command, message, redis, matchResult, auth }: InputParameter ) {
	
	const userID: string = messageData.msg.author.id;
	const guildId: string = messageData.msg.guild_id;
	const attachments = messageData.msg.attachments;
	
	const header = ( <OrderMatchResult>matchResult ).header;
	const au: AuthLevel = await auth.get( userID, guildId );
	
	const CALL_MASTER = <Order>command.getSingle( "adachi-call-master", au );
	const REPLY_USER = <Order>command.getSingle( "adachi-reply-user", au );
	
	if ( CALL_MASTER.getHeaders().includes( header ) ) {
		const content = messageData.msg.content;
		if ( content.length <= 0 && !attachments ) {
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
		const sendMasterFunc = await message.getSendMasterFunc( msgId );
		const guildInfo = await getGuildBaseInfo( guildId );
		
		const embedMsg: Embed = new EmbedMsg(
			'有人给你留言啦 ~ ',
			"",
			'频道反馈消息',
			avatar,
			`用户：${ name }`,
			`方式：${ type }`,
			`频道：${ guildInfo?.name }`,
			`消息：\n\n`,
			`${ content }\n\n`,
			`使用 ${ REPLY_USER.getHeaders()[0] } 引用消息快捷回复 ~ `
		)
		try {
			await sendMasterFunc( { embed: embedMsg } );
			if ( attachments ) {
				attachments.forEach( value => {
					sendMasterFunc( { image: "https://" + value.url } );
				} );
			}
			const messageRes = await sendMasterFunc( `引用此消息回复：[ ${ name } ]` );
			await sendMessage( `已将消息发送给开发者啦 ~ ` );
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
	} else if ( REPLY_USER.getHeaders().includes( header ) ) {
		const rawContent: string = "开发者回复：" + messageData.msg.content;
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
			let sendToUser: SendFunc;
			if ( fakeGuildId !== "" ) {
				//首先处理私聊信息回复逻辑
				sendToUser = message.sendPrivateMessage( fakeGuildId, msgId );
			} else if ( channelId !== "" ) {
				sendToUser = message.sendGuildMessage( channelId, msgId );
			} else {
				//消息ID已超过五分钟，采用私聊推送
				sendToUser = await message.getSendPrivateFunc( guildId, userId );
				content.message_reference = undefined;
			}
			//发送消息
			await sendToUser( content );
			//引用回复无法携带附件
			// if ( attachments ) {
			// 	attachments.forEach( value => {
			// 		sendToUser( { image: "https://" + value.url } );
			// 	} );
			// }
		} catch ( error ) {
			const err = <ErrorMsg>error;
			await sendMessage( err.message );
		}
	}
}