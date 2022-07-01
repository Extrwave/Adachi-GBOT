/**
 Author: Ethereal
 CreateTime: 2022/6/12
 */

import BotConfig from "@modules/config";
import { IDirectMessage, IMessage, IMessageRes, IOpenAPI, MessageToCreate } from 'qq-guild-bot';
import Database from "@modules/database";
import { Message, MessageType } from "@modules/utils/message";


export type SendFunc = ( content: MessageToCreate | string, allowAt?: boolean ) => Promise<IMessage | void>;

interface MsgManagementMethod {
	getPrivateSendFunc( guildId: string, userId: string ): Promise<SendFunc>;
	sendToMaster( msgId: string ): Promise<SendFunc>;
	sendPrivateMessage( guildId: string, msgId: string ): SendFunc;
	sendGuildMessage( channelId: string, msgId: string ): SendFunc;
}

export default class MsgManager implements MsgManagementMethod {
	
	private readonly atUser: boolean;
	private readonly client: IOpenAPI;
	private readonly redis: Database;
	private readonly config: BotConfig;
	
	constructor( config: BotConfig, client: IOpenAPI, redis: Database ) {
		this.atUser = config.atUser;
		this.client = client;
		this.redis = redis;
		this.config = config;
	}
	
	/*构建私聊会话*/
	async getPrivateSender( guildId: string, userId: string ): Promise<IDirectMessage> {
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
	public async getPrivateSendFunc( guildId: string, userId: string, msgId?: string ): Promise<SendFunc> {
		const client = this.client;
		const { guild_id, channel_id, create_time } = await this.getPrivateSender( guildId, userId );
		return async function ( content: MessageToCreate | string ): Promise<IMessage | any> {
			if ( msgId ) {
				if ( typeof content === 'string' ) {
					const response = await client.directMessageApi.postDirectMessage( guild_id, {
						content: content,
						msg_id: msgId,
					} );
					return <IMessage>response.data;
				} else {
					content.msg_id = msgId;
					const response = await client.directMessageApi.postDirectMessage( guild_id, content );
					return <IMessage>response.data;
				}
			} else {
				if ( typeof content === 'string' ) {
					await client.directMessageApi.postDirectMessage( guild_id, {
						content: content,
					} );
				} else {
					await client.directMessageApi.postDirectMessage( guild_id, content );
				}
			}
		}
	}
	
	/* 给管理员发送消息的方法，主动/被动 */
	public async sendToMaster( msgId?: string ): Promise<SendFunc> {
		const masterGuildId = await this.redis.getString( `adachi.guild-master` ); //当前BOT主人所在频道
		return await this.getPrivateSendFunc( masterGuildId, this.config.master, msgId );
	}
	
	/*私信回复方法 被动回复*/
	public sendPrivateMessage( guildId: string, msgId: string ): SendFunc {
		const client = this.client;
		return async function ( content: MessageToCreate | string ): Promise<IMessage> {
			if ( typeof content === 'string' ) {
				const response = await client.directMessageApi.postDirectMessage( guildId, {
					content: content,
					msg_id: msgId
				} );
				return response.data;
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
		return async function ( content: MessageToCreate | string ) {
			if ( msgId ) {
				if ( typeof content === 'string' ) {
					const response = await client.messageApi.postMessage( channelId, {
						content: content,
						msg_id: msgId,
						message_reference: {
							message_id: msgId,
							ignore_get_message_error: true
						}
					} );
					return response.data;
				} else {
					content.msg_id = msgId;
					const response = await client.messageApi.postMessage( channelId, content );
					return response.data;
				}
			} else {
				//主动消息发送
				if ( typeof content === 'string' ) {
					await client.messageApi.postMessage( channelId, {
						content: content,
					} );
				} else {
					content.msg_id = undefined;
					await client.messageApi.postMessage( channelId, content );
				}
				
			}
		}
	}
	
	async getMessageInfo( channelId: string, msgId: string ): Promise<IMessageRes> {
		const bot = this.client;
		const response = await bot.messageApi.message( channelId, msgId );
		return response.data;
	}
	
}

export function removeStringPrefix( string: string, prefix: string ): string {
	return string.replace( prefix, "" );
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




