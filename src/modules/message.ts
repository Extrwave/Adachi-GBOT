/**
 Author: Ethereal
 CreateTime: 2022/6/12
 */
import bot from "ROOT";
import * as fs from 'fs';
import { resolve } from 'path';
import FormData from 'form-data';////需要自己安装
import fetch from 'node-fetch';//需要自己安装
import BotConfig from "@modules/config";
import { IDirectMessage, IMessage, IMessageRes, IOpenAPI, MessageToCreate } from 'qq-guild-bot';
import Database from "@modules/database";
import { Message, MessageType } from "@modules/utils/message";

const environment = {
	sandbox: "https://sandbox.api.sgroup.qq.com",
	online: "https://api.sgroup.qq.com"
}

interface MessageToSend extends MessageToCreate {
	file_image?: fs.ReadStream;
}

export type SendFunc = ( content: MessageToSend | string, allowAt?: boolean ) => Promise<IMessage | void>;

interface MsgManagementMethod {
	getSendPrivateFunc( guildId: string, userId: string ): Promise<SendFunc>;
	getSendMasterFunc( msgId: string ): Promise<SendFunc>;
	sendPrivateMessage( guildId: string, msgId: string ): SendFunc;
	sendGuildMessage( channelId: string, msgId: string ): SendFunc;
}

export default class MsgManager implements MsgManagementMethod {
	
	private readonly atUser: boolean;
	private readonly client: IOpenAPI;
	private readonly redis: Database;
	private readonly config: BotConfig;
	private readonly apiUrl: string;
	
	constructor( config: BotConfig, client: IOpenAPI, redis: Database ) {
		this.atUser = config.atUser;
		this.client = client;
		this.redis = redis;
		this.config = config;
		this.apiUrl = this.config.sandbox ? environment.sandbox : environment.online;
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
		const client = this.client;
		const apiUrl = this.apiUrl;
		msgId = "1000";//随时都可能失效，失效后删掉此行
		const { guild_id, channel_id, create_time } = await this.getPrivateSendParam( guildId, userId );
		return async function ( content: MessageToSend | string ): Promise<IMessage | any> {
			if ( typeof content === 'string' ) {
				const response = await client.directMessageApi.postDirectMessage( guild_id, {
					content: content,
					msg_id: msgId,
				} );
				return <IMessage>response.data;
			} else if ( content.file_image ) {
				let formdata = new FormData();
				formdata.append( "file_image", content.file_image );
				if ( msgId )
					formdata.append( "msg_id", msgId );
				if ( content.content )
					formdata.append( "content", content.content );
				await fetch( `${ apiUrl }/dms/${ guildId }/messages`, {
					method: "POST",
					headers: {
						"Content-Type": formdata.getHeaders()["content-type"],
						"Authorization": `Bot ${ bot.config.appID }.${ bot.config.token }`
					},
					body: formdata
				} ).then( async res => {
					if ( res.status !== 200 ) {
						throw new Error( res.statusText );
					}
					return res.statusText;
				} ).catch( error => {
					console.log( error );
				} )
			} else {
				content.msg_id = msgId;
				const response = await client.directMessageApi.postDirectMessage( guild_id, content );
				return <IMessage>response.data;
			}
		}
	}
	
	/* 给管理员发送消息的方法，主动/被动 */
	public async getSendMasterFunc( msgId?: string ): Promise<SendFunc> {
		msgId = "1000";//随时都可能失效，失效后删掉此行
		const masterGuildId = await this.redis.getString( `adachi.guild-master` ); //当前BOT主人所在频道
		return await this.getSendPrivateFunc( masterGuildId, this.config.master, msgId );
	}
	
	/*私信回复方法 被动回复*/
	public sendPrivateMessage( guildId: string, msgId: string ): SendFunc {
		const client = this.client;
		const apiUrl = this.apiUrl;
		msgId = "1000"; //随时都可能失效，失效后删掉此行
		return async function ( content: MessageToSend | string ) {
			if ( typeof content === 'string' ) {
				const response = await client.directMessageApi.postDirectMessage( guildId, {
					content: content,
					msg_id: msgId
				} );
				return response.data;
			} else if ( content.file_image ) {
				let formdata = new FormData();
				formdata.append( "file_image", content.file_image );
				if ( msgId )
					formdata.append( "msg_id", msgId );
				if ( content.content )
					formdata.append( "content", content.content );
				await fetch( `${ apiUrl }/dms/${ guildId }/messages`, {
					method: "POST",
					headers: {
						"Content-Type": formdata.getHeaders()["content-type"],
						"Authorization": `Bot ${ bot.config.appID }.${ bot.config.token }`
					},
					body: formdata
				} ).then( async res => {
					if ( res.status !== 200 ) {
						throw new Error( res.statusText );
					}
					return res.statusText;
				} ).catch( error => {
					console.log( error );
				} )
			} else {
				content.msg_id = msgId;
				const response = await client.directMessageApi.postDirectMessage( guildId, content );
				return response.data;
			}
		}
	}
	
	/* 回复频道消息方法，主动、被动*/
	public sendGuildMessage( channelId: string, msgId?: string ): SendFunc {
		const client = this.client;
		const apiUrl = this.apiUrl;
		return async function ( content: MessageToSend | string ) {
			if ( typeof content === 'string' ) {
				const response = await client.messageApi.postMessage( channelId, {
					content: content,
					msg_id: msgId,
					message_reference: {
						message_id: msgId ? msgId : "undefine",
						ignore_get_message_error: true
					}
				} );
				return response.data;
			} else if ( content.file_image ) {
				let formdata = new FormData();
				formdata.append( "file_image", content.file_image );
				if ( msgId )
					formdata.append( "msg_id", msgId );
				if ( content.content )
					formdata.append( "content", content.content );
				await fetch( `${ apiUrl }/channels/${ channelId }/messages`, {
					method: "POST",
					headers: {
						"Content-Type": formdata.getHeaders()["content-type"],
						"Authorization": `Bot ${ bot.config.appID }.${ bot.config.token }`
					},
					body: formdata
				} ).then( async res => {
					if ( res.status !== 200 ) {
						throw new Error( res.statusText );
					}
					return res.statusText;
				} ).catch( error => {
					console.log( error );
				} )
			} else {
				content.msg_id = msgId;
				const response = await client.messageApi.postMessage( channelId, content );
				return response.data;
			}
		}
	}
	
	async getMessageInfo( channelId: string, msgId: string ):
		Promise<IMessageRes> {
		const bot = this.client;
		const response = await bot.messageApi.message( channelId, msgId );
		return response.data;
	}
	
}

export function getMessageType( data: Message ): MessageType {
	if ( data.eventType === 'MESSAGE_CREATE' || data.eventType === 'AT_MESSAGE_CREATE' ) {
		return MessageType.Group;
	} else if ( data.eventType === 'DIRECT_MESSAGE_CREATE' ) {
		return MessageType.Private;
	} else {
		return MessageType.Unknown;
	}
}




