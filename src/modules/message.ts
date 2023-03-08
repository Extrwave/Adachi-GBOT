/**
 Author: Ethereal
 CreateTime: 2022/6/12
 */
import bot from "ROOT";
import v4 from "uuid";
import FormData from 'form-data';////需要自己安装
import BotSetting from "@modules/config";
import requests from "@modules/requests";
import {
	IDirectMessage,
	IGuild, IMessage,
	IMessageRes, IOpenAPI
} from 'qq-guild-bot';
import Redis, { __RedisKey } from "@modules/redis";
import { ErrorMsg, Message, MessageEntity, MessageToSend, MessageType } from "@modules/utils/message";
import { Account, getGuildBaseInfo, getMemberInfo } from "@modules/utils/account";

export type SendFunc = ( content: MessageToSend | string, atUser?: boolean ) => Promise<IMessage>;

interface MsgManagementMethod {
	/* 已知频道私信发送方法 */
	getSendPrivateFunc( userId: string, guildId: string, msgId?: string ): Promise<SendFunc>;
	/* 主动私信推送方法 */
	getPostPrivateFunc( userId: string, msgId?: string ): Promise<SendFunc | undefined>;
	/* 主动Master私信推送方法 */
	getSendMasterFunc( msgId?: string ): Promise<SendFunc>;
	/* 主被动频道消息发送方法 */
	getSendGuildFunc( userId: string, guildId: string, channelId: string, msgId?: string ): Promise<SendFunc>;
}

export default class MsgManager implements MsgManagementMethod {
	
	private readonly client: IOpenAPI;
	private readonly redis: Redis;
	private readonly config: BotSetting;
	
	constructor( config: BotSetting, client: IOpenAPI, redis: Redis ) {
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
	public async getSendPrivateFunc( userId: string, guildId: string, msgId?: string ): Promise<SendFunc> {
		msgId = msgId ? msgId : "1000";//随时都可能失效，失效后删掉此行
		const { guild_id } = await this.getPrivateSendParam( guildId, userId );
		const guildInfo = <IGuild>await getGuildBaseInfo( guildId );
		const userInfo = <Account>await getMemberInfo( userId, guildId );
		const guildName = guildInfo.name;
		const userName = userInfo.account.nick;
		return this.sendMessageEntity( userId, userName, guildName, guild_id, true, msgId );
	}
	
	/*私信回复发送方法*/
	public async getReplyPrivateFunc( userId: string, guildId: string, userName: string, guildName: string, msgId?: string ): Promise<SendFunc> {
		msgId = msgId ? msgId : "1000";//随时都可能失效，失效后删掉此行
		return this.sendMessageEntity( userId, userName, guildName, guildId, true, msgId );
	}
	
	/* 回复频道消息方法，主动、被动*/
	public async getSendGuildFunc( userId: string, guildId: string, channelId: string, msgId?: string ): Promise<SendFunc> {
		msgId = msgId ? msgId : "1000"; //随时都可能失效，失效后删掉此行
		const guildInfo = <IGuild>await getGuildBaseInfo( guildId );
		const guildName = guildInfo ? guildInfo.name : "神秘频道";
		const userInfo = <Account>await getMemberInfo( userId, guildId );
		const userName = userInfo ? userInfo.account.nick : "神秘用户";
		return this.sendMessageEntity( userId, userName, guildName, channelId, false, msgId );
	}
	
	
	/* 给管理员发送消息的方法，主动/被动 */
	public async getSendMasterFunc( msgId?: string ): Promise<SendFunc> {
		msgId = msgId ? msgId : "1000";//随时都可能失效，失效后删掉此行
		const masterGuildId = await this.redis.getString( __RedisKey.GUILD_MASTER ); //当前BOT主人所在频道
		return await this.getSendPrivateFunc( this.config.master, masterGuildId, msgId );
	}
	
	/* 主动私信推送方法 */
	public async getPostPrivateFunc( userId: string, msgId?: string ): Promise<SendFunc | undefined> {
		msgId = msgId ? msgId : "1000";//随时都可能失效，失效后删掉此行
		const guilds: string[] = await bot.redis.getSet( `${ __RedisKey.USER_USED_GUILD }-${ userId }` );
		
		for ( let guildId of guilds ) {
			/* 判断用户是否退出频道 */
			const userInfo = await getMemberInfo( userId, guildId );
			if ( !userInfo ) {
				continue;
			}
			
			await bot.redis.setString( `${ __RedisKey.USER_INFO }-${ userId }`, JSON.stringify( userInfo ), 3600 * 24 );
			try {
				/* 尝试发送一条空消息判断是否支持发送 */
				const response = await bot.client.directMessageApi.createDirectMessage( {
					source_guild_id: guildId,
					recipient_id: userId
				} );
				await bot.client.directMessageApi.postDirectMessage( response.data.guild_id, {
					content: "",
					msg_id: msgId
				} );
			} catch ( error ) {
				const err = <ErrorMsg>error;
				if ( err.code === 50006 ) {
					return await this.getSendPrivateFunc( userId, guildId, msgId );
				}
			}
		}
		bot.logger.debug( `[${ userId }] 用户无可用推送消息的频道` );
		return;
	}
	
	
	async getMessageInfo( channelId: string, msgId: string ):
		Promise<IMessageRes> {
		const bot = this.client;
		const response = await bot.messageApi.message( channelId, msgId );
		return response.data;
	}
	
	sendMessageEntity(
		userId: string, userName: string, guildName: string,
		targetId: string, isDirect: boolean, msgId?: string
	): SendFunc {
		const sendMessage = this.sendMessageFunc( targetId, isDirect );
		return async function ( message: MessageToSend | string, atUser?: boolean ): Promise<IMessage> {
			
			const formData = new FormData();
			const logInfo: string[] = [ `[Send]`, `${ isDirect ? "[Private]" : "[Guild]" }`,
				`[A: ${ userName }]`, `[G: ${ guildName }]`, ":" ];
			/* 添加msg_id */
			msgId ? formData.append( "msg_id", msgId ) : "";
			if ( !message || typeof message === 'string' ) {
				message = message ?
					atUser ? `<@!${ atUser }> ${ message }` : message
					: atUser ? `<@!${ atUser }>` : "" + `BOT尝试发送一条空消息，一般是没有正确返回错误信息，请记录时间点向开发者反馈 ~`;
				formData.append( "content", message );
				logInfo.push( message );
			} else if ( message.embed || message.ark || message.markdown || message.keyboard ) {
				message.msg_id = msgId;
				message.embed ? logInfo.push( "[EMBED]", message.embed.title ) : "";
				message.ark ? logInfo.push( "[ARK]" ) : "";
				message.markdown ? logInfo.push( "MARKDOWN" ) : "";
				message.keyboard ? logInfo.push( "KEYBOARD" ) : "";
				const data = await sendMessage( { type: 'normal', data: message } );
				bot.logger.info( logInfo.join( " " ) );
				return data;
			} else {
				/* 添加file_image */
				if ( message.file_image ) {
					let data, type = 'png';
					if ( typeof message.file_image !== 'string' ) {
						data = message.file_image.data;
						type = message.file_image.type;
					} else {
						data = message.file_image;
					}
					formData.append( "file_image", Buffer.from( data, 'base64' ), {
						contentType: `image/${ type }`,
						filename: v4() + `.${ type }`
					} );
					logInfo.push( "[IMAGE]" );
				}
				/* image */
				if ( message.image ) {
					formData.append( "image", message.image );
					logInfo.push( "[IMAGE]" );
				}
				/* message_reference */
				if ( message.message_reference ) {
					formData.append( "message_reference", message.message_reference );
				}
				/* 添加content */
				if ( message.content ) {
					message.content = atUser ? `<@!${ atUser }> ${ message.content }` : message.content;
					formData.append( "content", message.content );
					logInfo.push( message.content );
				}
			}
			const data = await sendMessage( { type: 'formData', data: formData } );
			bot.logger.info( logInfo.join( " " ) );
			return data;
		}
	}
	
	sendMessageFunc( targetId: string, isDirect: boolean ) {
		const client = this.client;
		return async function ( message: MessageEntity ): Promise<IMessage> {
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
			
			if ( message.type === "formData" ) {
				const res = await requests( {
					url: url,
					method: "POST",
					headers: {
						"Content-Type": message.data.getHeaders()["content-type"],
						"Authorization": `Bot ${ bot.config.appID }.${ bot.config.token }`
					},
					body: message.data
				} );
				return res.data;
			} else {
				if ( isDirect ) {
					const res = await client.directMessageApi.postDirectMessage( targetId, message.data );
					return res.data;
				} else {
					const res = await client.messageApi.postMessage( targetId, message.data );
					return res.data;
				}
			}
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

