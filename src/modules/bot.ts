/**
 Author: Ethereal
 CreateTime: 2022/6/12
 */
import {
	AvailableIntentsEventsEnum, createOpenAPI,
	createWebsocket, IGuild, IOpenAPI
} from "qq-guild-bot";
import * as log from "log4js";
import moment from "moment";
import BotConfig from "@modules/config";
import Database from "@modules/database";
import Interval from "@modules/management/interval";
import FileManagement from "@modules/file";
import Plugin, { PluginReSubs } from "@modules/plugin";
import WebConfiguration from "@modules/logger";
import WebConsole from "@web-console/backend";
import RefreshConfig from "@modules/management/refresh";
import { BasicRenderer } from "@modules/renderer";
import Command, { BasicConfig, MatchResult, removeHeaderInContent } from "@modules/command/main";
import Authorization, { AuthLevel } from "@modules/management/auth";
import MsgManager from "@modules/message";
import MsgManagement, * as Msg from "@modules/message";
import { MemberMessage, Message, MessageScope } from "@modules/utils/message";
import { JobCallback, scheduleJob } from "node-schedule";
import { trim } from "lodash";
import { getMemberInfo } from "@modules/utils/account";
import { EmbedMsg } from "@modules/utils/embed";
import { checkChannelLimit } from "#@management/channel";


export interface BOT {
	readonly redis: Database;
	readonly config: BotConfig;
	readonly client: IOpenAPI;
	readonly ws;
	readonly logger: log.Logger;
	readonly interval: Interval;
	readonly file: FileManagement;
	readonly auth: Authorization;
	readonly message: MsgManagement;
	readonly command: Command;
	readonly refresh: RefreshConfig;
	readonly renderer: BasicRenderer;
}

export class Adachi {
	public readonly bot: BOT;
	
	constructor( root: string ) {
		/* 初始化运行环境 */
		const file = new FileManagement( root );
		Adachi.setEnv( file );
		
		/* 初始化应用模块 */
		const config = new BotConfig( file );
		/* 实例化Logger */
		const logger = new WebConfiguration( config ).getLogger();
		if ( config.webConsole.enable ) {
			new WebConsole( config );
		}
		/* 创建client实例*/
		const client = createOpenAPI( {
			appID: config.appID,
			token: config.token,
			sandbox: config.sandbox
		} );
		// 创建 websocket 连接
		const ws = createWebsocket( {
				appID: config.appID,
				token: config.token,
				sandbox: config.sandbox,
				intents: this.getBotIntents( config )
			}
		);
		/* 捕获未知且未被 catch 的错误 */
		process.on( "unhandledRejection", reason => {
			if ( ( <Error>reason ).stack ) {
				logger.error( ( <Error>reason ).stack );
			} else if ( reason ) {
				logger.error( reason );
			}
		} );
		
		const redis = new Database( config.dbPort, config.dbPassword, logger, file );
		const interval = new Interval( config, redis );
		const auth = new Authorization( config, redis );
		const message = new MsgManager( config, client, redis );
		const command = new Command( file );
		const refresh = new RefreshConfig( file, command );
		const renderer = new BasicRenderer();
		
		this.bot = {
			client, ws, file, redis,
			logger, message, auth, command,
			config, refresh, renderer, interval
		};
		
		refresh.registerRefreshableFunc( renderer );
	}
	
	public run(): BOT {
		Plugin.load( this.bot ).then( commands => {
			this.bot.command.add( commands );
			
			/* 事件监听 ,根据机器人类型选择能够监听的事件 */
			if ( this.bot.config.area === "private" ) {
				/* 私域机器人 */
				this.bot.ws.on( "GUILD_MESSAGES", ( data: Message ) => {
					if ( data.eventType === 'MESSAGE_CREATE' )
						this.parseGroupMsg( this )( data );
				} );
			} else {
				/* 公域机器人 */
				this.bot.ws.on( "PUBLIC_GUILD_MESSAGES", ( data: Message ) => {
					if ( data.eventType === 'AT_MESSAGE_CREATE' )
						this.parseGroupMsg( this )( data );
				} );
			}
			/* 私信相关 */
			this.bot.ws.on( "DIRECT_MESSAGE", ( data: Message ) => {
				if ( data.eventType === 'DIRECT_MESSAGE_CREATE' )
					this.parsePrivateMsg( this )( data );
			} );
			/* 成员变动相关 */
			this.bot.ws.on( "GUILD_MEMBERS", ( data: MemberMessage ) => {
				if ( data.eventType === 'GUILD_MEMBER_REMOVE' )
					this.userDecrease( this )( data.msg.guild_id, data.msg.user.id );
			} )
			this.getBotBaseInfo( this )();
			this.bot.logger.info( "BOT启动成功" );
		} );
		
		
		scheduleJob( "0 59 */1 * * *", this.hourlyCheck( this ) );
		scheduleJob( "0 1 4 * * *", this.clearImage( this ) );
		scheduleJob( "0 1 */6 * * *", this.clearExitUser( this ) );
		scheduleJob( "0 30 */4 * * *", this.getBotBaseInfo( this ) );
		return this.bot;
	}
	
	private static setEnv( file: FileManagement ): void {
		file.createDir( "config", "root" );
		const exist: boolean = file.createYAML( "setting", BotConfig.initObject );
		if ( exist ) {
			return;
		}
		
		/* Created by http://patorjk.com/software/taag  */
		/* Font Name: Big                               */
		const greet =
			`====================================================================
                _            _     _        ____   ____ _______
       /\\      | |          | |   (_)      |  _ \\ / __ \\__   __|
      /  \\   __| | __ _  ___| |__  _ ______| |_) | |  | | | |
     / /\\ \\ / _\` |/ _\` |/ __| '_ \\| |______|  _ <| |  | | | |
    / ____ \\ (_| | (_| | (__| | | | |      | |_) | |__| | | |
   /_/    \\_\\__,_|\\__,_|\\___|_| |_|_|      |____/ \\____/  |_|
 
====================================================================`
		console.log( greet );
		
		file.createDir( "database", "root" );
		file.createDir( "logs", "root" );
		file.createDir( "data", "root" );
		
		file.createYAML(
			"cookies",
			{ cookies: [ "米游社Cookies(允许设置多个)" ] }
		);
		file.createYAML(
			"commands",
			{ tips: "此文件修改后需重启应用" }
		);
		
		console.log( "环境初始化完成，请在 /config 文件夹中配置信息" );
		process.exit( 0 );
	}
	
	/* 正则检测处理消息 */
	private async execute(
		messageData: Message,
		sendMessage: Msg.SendFunc,
		cmdSet: BasicConfig[],
		limits: string[],
		unionRegExp: RegExp,
		isPrivate: boolean,
		isAt: boolean
	): Promise<void> {
		
		/* bot正在重载指令配置 */
		if ( this.bot.refresh.isRefreshing ) {
			await sendMessage( "BOT重载配置中，请稍后..." );
			return;
		}
		
		/* 针对私域机器人做出 @优化 */
		if ( this.bot.config.area === "private" && this.bot.config.atBot && !isPrivate && !isAt ) {
			return;
		}
		
		/* 对设置可用子频道做出适配 更新管理员不受限制 */
		const auth = await this.bot.auth.get( messageData.msg.author.id );
		if ( !isPrivate && auth < AuthLevel.Manager ) {
			const guildId = messageData.msg.guild_id;
			const channelId = messageData.msg.channel_id;
			const { status, msg } = await checkChannelLimit( guildId, channelId );
			if ( status ) {
				await sendMessage( msg );
				return;
			}
		}
		
		
		let content: string = messageData.msg.content.trim() || '';
		/* 首先排除有些憨憨带上的 [] () |, 模糊匹配可能会出现这种情况但成功 */
		messageData.msg.content = content = content.replace( /\[|\]|\(|\)|\|/g, "" );
		
		/* 人工智障聊天, 匹配不到任何指令触发聊天，对私域进行优化，不@BOT不会触发自动回复 */
		if ( !unionRegExp.test( content ) ) {
			/* 未识别指令匹配 */
			const auth = await this.bot.auth.get( messageData.msg.author.id );
			const check = this.cmdLimitCheck( content, isPrivate, isAt, auth );
			if ( check ) {
				await sendMessage( check );
				return;
			}
			if ( this.bot.config.autoChat && content.length < 20 && isAt && !isPrivate ) {
				const { autoReply } = require( "@modules/chat" );
				await autoReply( messageData, sendMessage );
				return;
			}
		}
		
		/* 用户数据统计与收集，当用户使用了指令之后才统计 */
		const userID: string = messageData.msg.author.id;
		const guildID: string = isPrivate ? "-1" : messageData.msg.guild_id; // -1 代表私聊使用
		
		await this.bot.redis.addSetMember( `adachi.user-used-groups-${ userID }`, guildID ); //使用过的用户包括使用过的频道
		if ( isPrivate && messageData.msg.src_guild_id ) { //私聊源频道也记录，修复未在频道使用用户信息读取问题
			await this.bot.redis.addSetMember( `adachi.user-used-groups-${ userID }`, messageData.msg.src_guild_id );
		}
		
		/* 获取匹配指令对应的处理方法 */
		const usable: BasicConfig[] = cmdSet.filter( el => !limits.includes( el.cmdKey ) );
		const matchList: { matchResult: MatchResult; cmd: BasicConfig }[] = [];
		
		for ( let cmd of usable ) {
			const res: MatchResult = cmd.match( content );
			if ( res.type === "unmatch" ) {
				if ( res.missParam && res.header ) {
					matchList.push( { matchResult: res, cmd } );
				}
				continue;
			}
			matchList.push( { matchResult: res, cmd } )
		}
		
		if ( matchList.length === 0 ) return;
		/* 选择最长的 header 作为成功匹配项 */
		const { matchResult: res, cmd } = matchList.sort( ( prev, next ) => {
			const getHeaderLength = ( { matchResult }: typeof prev ) => {
				let length: number = 0;
				if ( matchResult.type === "unmatch" || matchResult.type === "order" ) {
					length = matchResult.header ? matchResult.header.length : 0;
				} else if ( matchResult.type === "switch" ) {
					length = matchResult.switch.length;
				} else {
					length = 233;
				}
				return length;
			}
			return getHeaderLength( next ) - getHeaderLength( prev );
		} )[0]
		
		if ( res.type === "unmatch" ) {
			const embedMsg = new EmbedMsg( `指令参数缺失或者错误`,
				undefined,
				`指令参数缺失或者错误`,
				messageData.msg.author.avatar,
				`你的参数：${ res.param ? res.param : "无" }`,
				`参数格式：${ cmd.desc[1] }`,
				`参数说明：${ cmd.detail }`,
				`\n[ ] 必填, ( ) 选填, | 选择` );
			await sendMessage( { embed: embedMsg } );
			return;
		}
		if ( res.type === "order" ) {
			const text: string = cmd.ignoreCase
				? content.toLowerCase() : content;
			messageData.msg.content = trim(
				removeHeaderInContent( text, res.header.toLowerCase() )
					.replace( / +/g, " " )
			);
		}
		cmd.run( {
			sendMessage, ...this.bot,
			messageData, matchResult: res
		} );
		
		/* 指令数据统计与收集 */
		await this.bot.redis.incHash( "adachi.hour-stat", userID.toString(), 1 ); //小时使用过的指令数目
		await this.bot.redis.incHash( "adachi.command-stat", cmd.cmdKey, 1 );
		return;
	}
	
	
	/* 处理私聊事件 */
	private parsePrivateMsg( that: Adachi ) {
		const bot = that.bot;
		return async function ( messageData: Message ) {
			const authorName = messageData.msg.author.username;
			const userID = messageData.msg.author.id;
			const msgID = messageData.msg.id;
			const content = messageData.msg.content;
			const guildId: string = messageData.msg.guild_id;
			const auth: AuthLevel = await bot.auth.get( userID );
			const limit: string[] = await bot.redis.getList( `adachi.user-command-limit-${ userID }` );
			const sendMessage: Msg.SendFunc = await bot.message.sendPrivateMessage(
				guildId, msgID
			);
			const cmdSet: BasicConfig[] = bot.command.get( auth, MessageScope.Private );
			const unionReg: RegExp = bot.command.getUnion( auth, MessageScope.Private );
			await that.execute( messageData, sendMessage, cmdSet, limit, unionReg, true, true );
			bot.logger.info( `[A: ${ authorName }][ID: ${ userID }]: ${ content }` );
		}
	}
	
	/* 处理群聊事件 */
	private parseGroupMsg( that: Adachi ) {
		const bot = that.bot;
		return async function ( messageData: Message ) {
			const isAt = await that.checkAtBOT( messageData );
			const authorName = messageData.msg.author.username;
			const guild = messageData.msg.guild_id;
			const channelID = messageData.msg.channel_id;
			const userID = messageData.msg.author.id;
			const msgID = messageData.msg.id;
			const content = messageData.msg.content;
			
			const guildInfo = <IGuild>( await bot.client.guildApi.guild( guild ) ).data;
			const auth: AuthLevel = await bot.auth.get( userID );
			const gLim: string[] = await bot.redis.getList( `adachi.group-command-limit-${ guild }` );
			const uLim: string[] = await bot.redis.getList( `adachi.user-command-limit-${ userID }` );
			const sendMessage: Msg.SendFunc = bot.message.sendGuildMessage(
				channelID, msgID );
			const cmdSet: BasicConfig[] = bot.command.get( auth, MessageScope.Group );
			const unionReg: RegExp = bot.command.getUnion( auth, MessageScope.Group );
			await that.execute( messageData, sendMessage, cmdSet, [ ...gLim, ...uLim ], unionReg, false, isAt );
			
			//暂存一下msg_id, guildId, channelId 供推送消息使用
			await bot.redis.setHashField( `adachi.guild-used-channel`, guild, channelID ); //记录可以推送消息的频道
			// await bot.redis.setString( `adachi.msgId-temp-${ guild }-${ channelID }`, msgID, 290 ); //记录推送消息引用的msgID，被动
			await bot.logger.info( `[A: ${ authorName }][G: ${ guildInfo.name }]: ${ content }` );
		}
	}
	
	/*去掉消息中的@自己信息*/
	private async checkAtBOT( msg: Message ): Promise<boolean> {
		const botID = await this.bot.redis.getString( `adachi.user-bot-id` );
		const mention = msg.msg.mentions;
		
		if ( !mention || mention.length <= 0 ) {
			return false;
		}
		const isAtBot = msg.msg.mentions.filter( value => {
			return value.id === botID;
		} );
		
		if ( isAtBot.length > 0 ) {
			const atBOTReg: RegExp = new RegExp( `<@!${botID}>`, "g" );
			const content: string = msg.msg.content;
			msg.msg.content = content
				.replace( atBOTReg, "" )
				.trim();
			return true;
		}
		return false;
	}
	
	/* 判断缺少权限或者频道/私聊指令限制 */
	private cmdLimitCheck( content: string, isPrivate: boolean, isAt: boolean, auth: AuthLevel ): string | undefined {
		
		let msg: string | undefined;
		
		/* 对封禁用户做出提示，私域有问题 */
		if ( auth === AuthLevel.Banned && isAt ) {
			return `您已成为封禁用户，请与管理员协商 ~ `;
		}
		
		const privateUnionReg: RegExp = this.bot.command.getUnion( AuthLevel.Master, MessageScope.Private );
		const groupUnionReg: RegExp = this.bot.command.getUnion( AuthLevel.Master, MessageScope.Group );
		
		if ( groupUnionReg.test( content ) ) {
			if ( !isPrivate ) {
				msg = `您没有权限执行此命令 ~ `;
			} else {
				msg = `该指令仅限群聊使用 ~ `;
			}
		} else if ( privateUnionReg.test( content ) ) {
			if ( isPrivate ) {
				msg = `您没有权限执行此命令 ~ `;
			} else {
				msg = `该指令仅限私聊使用 ~ `;
			}
		}
		return msg;
	}
	
	/* 数据统计 与 超量使用监看 */
	private hourlyCheck( that: Adachi ): JobCallback {
		const bot = that.bot;
		return function (): void {
			bot.redis.getHash( "adachi.hour-stat" ).then( async data => {
				const cmdOverusedUser: string[] = [];
				const threshold: number = bot.config.countThreshold;
				Object.keys( data ).forEach( key => {
					if ( parseInt( data[key] ) > threshold ) {
						cmdOverusedUser.push( key );
					}
				} );
				
				const length: number = cmdOverusedUser.length;
				if ( length !== 0 ) {
					const msg: string =
						`上个小时内有 ${ length } 个用户指令使用次数超过了阈值` +
						[ "", ...cmdOverusedUser.map( el => `${ el }: ${ data[el] }次` ) ]
							.join( "\n  - " );
					const sendMessage = await bot.message.getSendMasterFunc();
					await sendMessage( msg );
					/*频道限制BOT主动推送消息次数*/
					bot.logger.info( msg );
				}
				await bot.redis.deleteKey( "adachi.hour-stat" );
			} );
			
			bot.redis.getHash( "adachi.command-stat" ).then( async data => {
				const hourID: string = moment().format( "yy/MM/DD/HH" );
				await bot.redis.deleteKey( "adachi.command-stat" );
				await bot.redis.setString( `adachi.command-stat-${ hourID }`, JSON.stringify( data ) );
			} );
		}
	}
	
	/* 清除所有图片缓存 */
	private clearImage( that: Adachi ): JobCallback {
		const bot = that.bot;
		return function (): void {
			bot.redis.getKeysByPrefix( `adachi-temp-*` ).then( async data => {
				data.forEach( value => {
					bot.redis.deleteKey( value );
				} );
			} );
			bot.logger.info( "已清除所有缓存图片链接" );
		}
	}
	
	/**
	 * 获取BOT类型，并返回正确的intents
	 * 为使BOT能正确启动，默认最小权限
	 * 有额外事件需要，请先提前开启BOT在频道中的权限后添加
	 * 参考地址：https://bot.q.qq.com/wiki/develop/api/gateway/intents.html
	 */
	private getBotIntents( config: BotConfig ): Array<AvailableIntentsEventsEnum> {
		let intents: Array<AvailableIntentsEventsEnum> = [
			AvailableIntentsEventsEnum.GUILDS,
			AvailableIntentsEventsEnum.GUILD_MEMBERS,
			AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS,
			AvailableIntentsEventsEnum.DIRECT_MESSAGE,
			AvailableIntentsEventsEnum.INTERACTION,
			AvailableIntentsEventsEnum.MESSAGE_AUDIT,
			AvailableIntentsEventsEnum.AUDIO_ACTION,
			AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES
			// AvailableIntentsEventsEnum.FORUMS_EVENT, //仅私域可用
			// AvailableIntentsEventsEnum.GUILD_MESSAGES //仅私域可用
		];
		/* 仅私域BOT可以监听非@自己的消息 */
		if ( config.area === "private" ) {
			intents.push( AvailableIntentsEventsEnum.GUILD_MESSAGES,
				AvailableIntentsEventsEnum.FORUMS_EVENT );
		}
		return intents;
		
	}
	
	
	/* 获取BOT所在频道基础信息 */
	private getBotBaseInfo( that: Adachi ): JobCallback {
		const bot = that.bot;
		return async function () {
			await bot.redis.deleteKey( `adachi.guild-used` ); //重启重新获取BOT所在频道信息
			const responseMeApi = await bot.client.meApi.me();
			if ( !responseMeApi.data.id ) {
				bot.logger.error( "获取BOT自身信息失败..." );
				return;
			}
			await bot.redis.setString( `adachi.user-bot-id`, responseMeApi.data.id );
			
			let ackMaster = false;
			const guilds = await that.getBotInGuilds( bot );
			for ( let guild of guilds ) {
				await bot.redis.addSetMember( `adachi.guild-used`, guild.id ); //存入BOT所进入的频道
				if ( !ackMaster && guild.owner_id === bot.config.master ) {
					await bot.redis.setString( `adachi.guild-master`, guild.id ); //当前BOT主人所在频道
					ackMaster = true;
				}
			}
			if ( !ackMaster ) {
				bot.logger.error( "MasterID设置错误，部分功能会受到影响" );
			}
		}
	}
	
	/* 用户退出频道 */
	private userDecrease( that: Adachi ) {
		const bot = that.bot
		return async function ( guildId: string, userId: string ) {
			const dbKey = `adachi.user-used-groups-${ userId }`;
			await bot.redis.delSetMember( dbKey, guildId );
		}
	}
	
	/* 清除用户使用记录 */
	private clearUsedInfo( that: Adachi ) {
		const bot = that.bot
		return async function ( userId: string ) {
			
			const userInfo = await getMemberInfo( userId );
			const dbKey = `adachi.user-used-groups-${ userId }`;
			const guilds = await bot.redis.getSet( `adachi.user-used-groups-${ userId }` );
			
			/* 与机器人还有共同频道就不清除数据，或者只是信息获取失败，暂时不处理 */
			if ( userInfo || guilds.length > 1 ) {
				return;
			}
			
			//首先清除所有订阅服务
			for ( const plugin in PluginReSubs ) {
				try {
					await PluginReSubs[plugin].reSub( userId, bot );
				} catch ( error ) {
					bot.logger.error( `插件${ plugin }取消订阅事件执行异常：${ <string>error }` );
				}
			}
			//清除使用记录
			const dbKeys = await bot.redis.getKeysByPrefix( `*${ userId }*` );
			await bot.redis.deleteKey( dbKey, ...dbKeys );
			bot.logger.info( `已清除用户 ${ userId } 使用数据` );
		}
	}
	
	/* 清除BOT未上线时被移出频道的相关用户信息 (速度很慢，不要await调用) */
	private clearExitUser( that: Adachi ): JobCallback {
		const bot = that.bot;
		return function (): void {
			bot.logger.info( "开始检测用户是否退出BOT相关频道~" );
			bot.redis.getKeysByPrefix( `adachi.user-used-groups-*` ).then( async data => {
				data.forEach( value => {
					const userId = value.split( "-" )[3];
					that.clearUsedInfo( that )( userId );
				} );
			} );
		}
	}
	
	/* 获取BOT所在所有频道信息 */
	public async getBotInGuilds( bot: BOT ): Promise<IGuild[]> {
		let currentId = "", over = false, ackMaster = false, count = 10;
		const allGuilds: IGuild[] = [];
		while ( !over && count >= 0 ) {
			let responseMeGuilds;
			if ( currentId !== "" ) {
				responseMeGuilds = await bot.client.meApi.meGuilds( { after: currentId } );
			} else {
				responseMeGuilds = await bot.client.meApi.meGuilds();
			}
			const guilds: IGuild[] = responseMeGuilds.data;
			if ( guilds.length <= 0 && currentId === "" ) {
				bot.logger.error( "获取频道信息失败..." );
			} else if ( guilds.length <= 0 ) {
				over = true;
			} else {
				allGuilds.push( ...guilds );
				currentId = guilds[guilds.length - 1].id;
			}
		}
		return allGuilds;
	}
}