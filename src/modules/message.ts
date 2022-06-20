/**
 Author: Ethereal
 CreateTime: 2022/6/12
 */

import BotConfig from "@modules/config";
import {
	IDirectMessage,
	IOpenAPI,
	MessageToCreate
} from 'qq-guild-bot';

/* 监听到消息的类型 */
export interface Message {
	eventType: string,
	eventId: string,
	msg: {
		author: {
			avatar: string,
			bot: boolean,
			id: string,
			username: string
		},
		channel_id: string,
		content: string,
		direct_message?: true,
		guild_id: string,
		id: string,
		member?: {
			joined_at: string
		},
		timestamp: string
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

export type SendFunc = ( content: MessageToCreate | string, allowAt?: boolean ) => Promise<void>;

interface MsgManagementMethod {
	getPrivateSendFunc( guildId: string, userId: string ): Promise<SendFunc>;
	sendPrivateMessage( guildId: string, msg_id: string ): SendFunc;
	sendGuildMessage( channelID: string, msg_id: string ): SendFunc;
}

export default class MsgManager implements MsgManagementMethod {
	
	private readonly atUser: boolean;
	private readonly client: IOpenAPI;
	
	constructor( config: BotConfig, client: IOpenAPI ) {
		this.atUser = config.atUser;
		this.client = client;
	}
	
	/*构建私聊会话*/
	async getPrivateSender( guildID: string, userID: string ): Promise<IDirectMessage> {
		const response = await this.client.directMessageApi.createDirectMessage( {
			source_guild_id: guildID,
			recipient_id: userID
		} );
		
		return {
			guild_id: response.data.guild_id,
			channel_id: response.data.channel_id,
			create_time: response.data.create_time
		};
	}
	
	/*获取私信发送方法 主动*/
	public async getPrivateSendFunc( guildId: string, userId: string ): Promise<SendFunc> {
		const client = this.client;
		const { guild_id, channel_id, create_time } = await this.getPrivateSender( guildId, userId );
		return async function ( content: MessageToCreate | string ) {
			if ( typeof content === 'string' ) {
				await client.directMessageApi.postDirectMessage( guild_id, {
					content: content,
				} );
			} else {
				await client.directMessageApi.postDirectMessage( guild_id, content );
			}
		}
	}
	
	/*私信回复方法 被动*/
	public sendPrivateMessage( guildId: string, msg_id: string ): SendFunc {
		const client = this.client;
		return async function ( content: MessageToCreate | string ) {
			if ( typeof content === 'string' ) {
				await client.directMessageApi.postDirectMessage( guildId, {
					content: content,
					msg_id: msg_id
				} );
			} else {
				content.msg_id = msg_id;
				await client.directMessageApi.postDirectMessage( guildId, content );
			}
		}
	}
	
	/* 回复频道消息方法，被动*/
	public sendGuildMessage( channelID: string, msg_id?: string ): SendFunc {
		const client = this.client;
		return async function ( content: MessageToCreate | string ) {
			if ( typeof content === 'string' ) {
				await client.messageApi.postMessage( channelID, {
					content: content,
					msg_id: msg_id
				} );
			} else {
				content.msg_id = msg_id;
				await client.messageApi.postMessage( channelID, content );
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




