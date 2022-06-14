/**
 Author: Ethereal
 CreateTime: 2022/6/12
 */

import BotConfig from "@modules/config";
import {
	Ark, Embed,
	IDirectMessage,
	IMessage,
	IOpenAPI, MessageReference,
	MessageToCreate
} from 'qq-guild-bot';
import { RestyResponse } from 'resty-client';

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

export type SendFunc = ( content: MessageToCreate | string, allowAt?: boolean ) => Promise<void>;

interface MsgManagementMethod {
	getPrivateSender( guildID: string, userID: string ): Promise<RestyResponse<IDirectMessage>>;
	
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
	async getPrivateSender( guildID: string, userID: string ): Promise<RestyResponse<IDirectMessage>> {
		return await this.client.directMessageApi.createDirectMessage( {
			source_guild_id: guildID,
			recipient_id: userID
		} );
	}
	
	/*获取私信发送方法*/
	public getPrivateSendFunc( guildId: string, userId: string ): SendFunc {
		const client = this.client;
		let pGuildID = "", pChannelID = "";
		this.getPrivateSender( guildId, userId ).then( value => {
			pGuildID = value.data.guild_id;
			pChannelID = value.data.channel_id;
		} );
		return async function ( content: MessageToCreate | string ) {
			if ( typeof content === 'string' ) {
				await client.directMessageApi.postDirectMessage( guildId, {
					content: content,
				} );
			} else {
				await client.directMessageApi.postDirectMessage( guildId, content );
			}
		}
	}
	
	
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
	
	
	public sendGuildMessage( channelID: string, msg_id: string ): SendFunc {
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

export function isPrivateMessage( data: Message ): boolean {
	if ( data.eventType === 'DIRECT_MESSAGE_CREATE' ) {
		return true;
	} else {
		return false;
	}
}

export function isGroupMessage( data: Message ): boolean {
	if ( data.eventType === 'MESSAGE_CREATE' ) {
		return true;
	} else {
		return false;
	}
}

export interface Message {
	eventType: 'DIRECT_MESSAGE_CREATE' | 'MESSAGE_CREATE',
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



