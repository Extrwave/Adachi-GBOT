/**
 Author: Ethereal
 CreateTime: 2022/6/12
 */
import bot from "ROOT";
import * as fs from 'fs';
import FormData from 'form-data';////需要自己安装
import BotConfig from "@modules/config";
import { IDirectMessage, IMessage, IMessageRes, IOpenAPI, MessageToCreate } from 'qq-guild-bot';
import Database from "@modules/database";
import { Message, MessageType } from "@modules/utils/message";
import requests from "@modules/requests";

export interface MessageToSend extends MessageToCreate {
	file_image?: fs.ReadStream;
}

export type SendFunc = ( content: MessageToSend | string, atUser?: string ) => Promise<IMessage | void>;

interface MsgManagementMethod {
	getSendPrivateFunc( guildId: string, userId: string ): Promise<SendFunc>;
	getSendMasterFunc( msgId: string ): Promise<SendFunc>;
	sendPrivateMessage( guildId: string, msgId: string ): SendFunc;
	sendGuildMessage( channelId: string, msgId: string ): SendFunc;
}

export default class MsgManager implements MsgManagementMethod {
	
	private readonly client: IOpenAPI;
	private readonly redis: Database;
	private readonly config: BotConfig;
	
	constructor( config: BotConfig, client: IOpenAPI, redis: Database ) {
		this.client = client;
		this.redis = redis;
		this.config = config;
	}
	
	/*构建私聊会话*/
	async getPrivateSendParam( guildId: string, userId: string ): Promise<IDirectMessage> {
		const response = await this.client.directMessageApi.createDirectMessage( {
			source_guild_id: guildId,
			recipient_id: userId
		} );
		
		return {
			guild_id: response.data.guild_id,
			channel_id: response.data.channel_id,
			create_time: response.data.create_time
		};
	}
	
	/*获取私信发送方法 构建*/
	public async getSendPrivateFunc( guildId: string, userId: string, msgId?: string ): Promise<SendFunc> {
		msgId = "1000";//随时都可能失效，失效后删掉此行
		const { guild_id, channel_id, create_time } = await this.getPrivateSendParam( guildId, userId );
		return this.sendPrivateEntity( guild_id, msgId );
	}
	
	/*私信回复方法 被动回复*/
	public sendPrivateMessage( guildId: string, msgId: string ): SendFunc {
		msgId = "1000"; //随时都可能失效，失效后删掉此行
		return this.sendPrivateEntity( guildId, msgId );
	}
	
	/* 回复频道消息方法，主动、被动*/
	public sendGuildMessage( channelId: string, msgId?: string ): SendFunc {
		return this.sendGuildEntity( channelId, msgId );
	}
	
	/* 给管理员发送消息的方法，主动/被动 */
	public async getSendMasterFunc( msgId?: string ): Promise<SendFunc> {
		msgId = "1000";//随时都可能失效，失效后删掉此行
		const masterGuildId = await this.redis.getString( `adachi.guild-master` ); //当前BOT主人所在频道
		return await this.getSendPrivateFunc( masterGuildId, this.config.master, msgId );
	}
	
	async getMessageInfo( channelId: string, msgId: string ):
		Promise<IMessageRes> {
		const bot = this.client;
		const response = await bot.messageApi.message( channelId, msgId );
		return response.data;
	}
	
	sendPrivateEntity( guildId: string, msgId?: string ) {
		const client = this.client;
		const sendFileImage = this.sendFileImageFunc( true );
		return async function ( content: MessageToSend | string, atUser?: string ): Promise<IMessage> {
			if ( !content ) {
				content = `BOT尝试发送一条空消息，一般是没有正确返回错误信息，请记录时间点向开发者反馈 ~`;
				const response = await client.directMessageApi.postDirectMessage( guildId, {
					content: atUser ? `<@!${ atUser }> ${ content }` : content,
					msg_id: msgId
				} );
				return response.data;
			} else if ( typeof content === 'string' ) {
				const response = await client.directMessageApi.postDirectMessage( guildId, {
					content: atUser ? `<@!${ atUser }> ${ content }` : content,
					msg_id: msgId
				} );
				bot.logger.info( "[send private] : " + content );
				return response.data;
			}
			if ( content.file_image ) {
				let formData = new FormData();
				formData.append( "file_image", content.file_image );
				if ( msgId )
					formData.append( "msg_id", msgId );
				if ( content.content )
					formData.append( "content", atUser ? `<@!${ atUser }> ${ content.content }` : content.content );
				return sendFileImage( guildId, formData );
			} else {
				content.msg_id = msgId;
				if ( content.content && atUser ) {
					content.content = `<@!${ atUser } ${ content.content }>`;
				}
				const response = await client.directMessageApi.postDirectMessage( guildId, content );
				bot.logger.info( "[send private] : " + content.content );
				return response.data;
			}
		}
	}
	
	sendGuildEntity( guildId: string, msgId?: string ) {
		const client = this.client;
		const sendFileImage = this.sendFileImageFunc( false );
		return async function ( content: MessageToSend | string, atUser?: string ): Promise<IMessage> {
			if ( !content ) {
				content = `BOT尝试发送一条空消息，一般是没有正确返回错误信息，请带上截图向开发者反馈 ~`;
				const response = await client.messageApi.postMessage( guildId, {
					content: atUser ? `<@!${ atUser }> ${ content }` : content,
					msg_id: msgId
				} );
				return response.data;
			} else if ( typeof content === 'string' ) {
				const response = await client.messageApi.postMessage( guildId, {
					content: atUser ? `<@!${ atUser }> ${ content }` : content,
					msg_id: msgId
				} );
				bot.logger.info( `[send ${ guildId }] : ${ content }` );
				return response.data;
			}
			if ( content.file_image ) {
				let formData = new FormData();
				formData.append( "file_image", content.file_image );
				if ( msgId )
					formData.append( "msg_id", msgId );
				if ( content.content )
					formData.append( "content", atUser ? `<@!${ atUser }> ${ content.content }` : content.content );
				return sendFileImage( guildId, formData );
			} else {
				content.msg_id = msgId;
				if ( content.content && atUser ) {
					content.content = `<@!${ atUser } ${ content.content }>`;
				}
				const response = await client.messageApi.postMessage( guildId, content );
				bot.logger.info( `[send ${ guildId }] : ${ content.content }` );
				return response.data;
			}
		}
	}
	
	sendFileImageFunc( isDirect: boolean ) {
		return async function ( targetId: string, formData: FormData ) {
			const environment = {
				sandbox: "https://sandbox.api.sgroup.qq.com",
				online: "https://api.sgroup.qq.com"
			}
			const apiUrl = bot.config.sandbox ? environment.sandbox : environment.online;
			let url = '';
			if ( isDirect ) {
				url = `${ apiUrl }/dms/${ targetId }/messages`;
			} else {
				url = `${ apiUrl }/channels/${ targetId }/messages`;
			}
			
			return await requests( {
				url: url,
				method: "POST",
				headers: {
					"Content-Type": formData.getHeaders()["content-type"],
					"Authorization": `Bot ${ bot.config.appID }.${ bot.config.token }`
				},
				body: formData
			} );
		}
	}
}

export function getMessageType( data: Message ): MessageType {
	if ( data.eventType === 'MESSAGE_CREATE' || data.eventType === 'AT_MESSAGE_CREATE' ) {
		return MessageType.Guild;
	} else if ( data.eventType === 'DIRECT_MESSAGE_CREATE' ) {
		return MessageType.Private;
	} else {
		return MessageType.Unknown;
	}
}

