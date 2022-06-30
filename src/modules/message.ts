/**
 Author: Ethereal
 CreateTime: 2022/6/12
 */

import BotConfig from "@modules/config";
import {
	IDirectMessage, IMessage,
	IOpenAPI, IUser, MessageReference,
	MessageToCreate
} from 'qq-guild-bot';
import Database from "@modules/database";

/* 监听到消息的类型 */
export interface Message {
	eventType: string,
	eventId: string,
	msg: Msg
}

/* 此处是SDK摆烂没更新的部分 */
interface Msg extends IMessage {
	direct_message?: boolean,
	src_guild_id?: string,
	message_reference?: MessageReference
}


/* 监听到成员变动消息的类型 */
export interface MemberMessage {
	eventType: string,
	eventId: string,
	msg: {
		guild_id: string,
		joined_at: string,
		nick: string,
		op_user_id: string,
		roles: [],
		user: IUser
	}
}

/* BOT进入退出新旧频道监听事件 */
export interface GuildsMove {
	eventType: string,
	eventId: string,
	msg: {
		description: string,
		icon: string,
		id: string,
		joined_at: string,
		max_members: number,
		member_count: number,
		name: string,
		op_user_id: string,
		owner: true,
		owner_id: string,
		union_appid: string,
		union_org_id: string,
		union_world_id: string
	}
}


export enum MessageScope {
	Neither,
	Group = 1 << 0,
	Private = 1 << 1,
	Both = Group | Private
}

export enum MessageType {
	Group,
	Private,
	Unknown
}


export interface SendMsgType {
	code: "msg" | "image",
	data: string
}

/* SDK 消息错误类型 */
export interface ErrorMsg {
	code: number,
	message: string,
	traceid: string,
}

export type SendFunc = ( content: MessageToCreate | string, allowAt?: boolean ) => Promise<void>;

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
		return async function ( content: MessageToCreate | string ) {
			if ( msgId ) {
				if ( typeof content === 'string' ) {
					await client.directMessageApi.postDirectMessage( guild_id, {
						content: content,
						msg_id: msgId,
					} );
				} else {
					content.msg_id = msgId;
					await client.directMessageApi.postDirectMessage( guild_id, content );
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
		return async function ( content: MessageToCreate | string ) {
			if ( typeof content === 'string' ) {
				await client.directMessageApi.postDirectMessage( guildId, {
					content: content,
					msg_id: msgId
				} );
			} else {
				content.msg_id = msgId;
				await client.directMessageApi.postDirectMessage( guildId, content );
			}
		}
	}
	
	/* 回复频道消息方法，主动、被动*/
	public sendGuildMessage( channelId: string, msgId?: string ): SendFunc {
		const client = this.client;
		return async function ( content: MessageToCreate | string ) {
			if ( msgId ) {
				if ( typeof content === 'string' ) {
					await client.messageApi.postMessage( channelId, {
						content: content,
						msg_id: msgId,
						message_reference: {
							message_id: msgId,
							ignore_get_message_error: true
						}
					} );
				} else {
					content.msg_id = msgId;
					await client.messageApi.postMessage( channelId, content );
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




