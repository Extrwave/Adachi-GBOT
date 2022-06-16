/**
 Author: Ethereal
 CreateTime: 2022/6/12
 */
import * as sdk from "qq-guild-bot";
import * as log from "log4js";
import moment from "moment";
import BotConfig from "./config";
import Database from "./database";
import Interval from "./management/interval";
import FileManagement from "./file";
import Plugin from "./plugin";
import WebConfiguration from "./logger";
import WebConsole from "@web-console/backend";
import RefreshConfig from "./management/refresh";
import { BasicRenderer } from "@modules/renderer";
import Command, { BasicConfig, MatchResult } from "./command/main";
import Authorization, { AuthLevel } from "./management/auth";
import MsgManagement, * as msg from "./message";
import MsgManager, { Message, MessageScope, SendFunc } from "./message";
import { JobCallback, scheduleJob } from "node-schedule";
import { trim } from "lodash";
import { unlinkSync } from "fs";
import Qiniuyun from "@modules/qiniuyun";


export interface BOT {
	readonly redis: Database;
	readonly config: BotConfig;
	readonly client: sdk.IOpenAPI;
	readonly ws;
	readonly logger: log.Logger;
	readonly qiniuyun: Qiniuyun;
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
		/* 创建七牛云实例*/
		const qiniuyun = new Qiniuyun( config );
		/* 创建client实例*/
		const client = sdk.createOpenAPI( {
			appID: config.appID,
			token: config.token,
			sandbox: config.sandbox,
		} );
		// 创建 websocket 连接
		const ws = sdk.createWebsocket( {
				appID: config.appID,
				token: config.token,
				sandbox: config.sandbox
			}
		);
		/* 捕获未知且未被 catch 的错误 */
		process.on( "unhandledRejection", reason => {
			logger.error( "未知错误：" + JSON.stringify( reason ) );
		} );
		
		const redis = new Database( config.dbPort, config.dbPassword, logger, file );
		const interval = new Interval( config, redis );
		const auth = new Authorization( config, redis );
		const message = new MsgManager( config, client );
		const command = new Command( file );
		const refresh = new RefreshConfig( file, command );
		const renderer = new BasicRenderer();
		
		this.bot = {
			client, ws, file, redis,
			logger, message, auth, command,
			config, refresh, renderer, interval, qiniuyun
		};
		
		refresh.registerRefreshableFunc( renderer );
	}
	
	public run(): BOT {
		Plugin.load( this.bot ).then( commands => {
			this.bot.command.add( commands );
			//是否登陆成功
			this.botOnline();
			/* 事件监听 */
			this.bot.ws.on( "GUILD_MESSAGES", ( data ) => {
				this.parseGroupMsg( this )( data );
			} );
			this.bot.ws.on( "DIRECT_MESSAGE", ( data ) => {
				this.parsePrivateMsg( this )( data );
			} );
			
			this.bot.logger.info( "事件监听启动成功" );
			/* 获取频道ID 暂时只支持 Master 所在频道主动推送 */
			this.bot.client.meApi.meGuilds().then( async r => {
				const guilds: sdk.IGuild[] = r.data;
				if ( guilds.length <= 0 )
					this.bot.logger.error( "获取频道信息失败..." );
				await this.bot.redis.setString( `adachi.guild-number`, guilds.length );
				for ( let guild of guilds ) {
					if ( guild.owner_id === this.bot.config.master ) {
						await this.bot.redis.setString( `adachi.guild-id`, guild.id ); //当前BOT主人所在频道
						return;
					}
					this.bot.logger.error( "频道信息获取错误，或者MasterID设置错误，部分功能会受到影响" );
				}
			} );
		} );
		
		scheduleJob( "0 59 */1 * * *", this.hourlyCheck( this ) );
		scheduleJob( "0 0 4 ? * WED", this.clearImageCache( this ) );
		
		return this.bot;
	}
	
	private static setEnv( file: FileManagement ): void {
		file.createDir( "config", "root" );
		const exist
			:
			boolean = file.createYAML( "setting", BotConfig.initObject );
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
		messageData: msg.Message,
		sendMessage: SendFunc,
		cmdSet: BasicConfig[],
		limits: string[],
		unionRegExp: RegExp,
		isPrivate: boolean
	): Promise<void> {
		const content: string = messageData.msg.content;
		
		if ( this.bot.refresh.isRefreshing || !unionRegExp.test( content ) ) {
			return;
		}
		
		const usable: BasicConfig[] = cmdSet.filter( el => !limits.includes( el.cmdKey ) );
		for ( let cmd of usable ) {
			const res: MatchResult = cmd.match( content );
			if ( res.type === "unmatch" ) {
				continue;
			}
			if ( res.type === "order" ) {
				const text: string = cmd.ignoreCase
					? content.toLowerCase() : content;
				messageData.msg.content = trim(
					msg.removeStringPrefix( text, res.header.toLowerCase() )
						.replace( / +/g, " " )
				);
			}
			cmd.run( {
				sendMessage, ...this.bot,
				messageData, matchResult: res
			} );
			
			/* 数据统计与收集 */
			const userID: string = messageData.msg.author.id;
			const groupID: string = msg.isGroupMessage( messageData ) ? messageData.msg.channel_id : "-1";
			await this.bot.redis.addSetMember( `adachi.user-used-groups-${ userID }`, groupID );
			await this.bot.redis.incHash( "adachi.hour-stat", userID.toString(), 1 );
			await this.bot.redis.incHash( "adachi.command-stat", cmd.cmdKey, 1 );
			return;
		}
	}
	
	/* 清除缓存图片 */
	private clearImageCache( that: Adachi ) {
		const bot = that.bot;
		return function () {
			const files: string[] = bot.file.getDirFiles( "data/image", "root" );
			files.forEach( f => {
				const path: string = bot.file.getFilePath(
					`data/image/${ f }`, "root"
				);
				unlinkSync( path );
			} );
			bot.logger.info( "图片缓存已清空" );
		}
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
			const sendMessage: SendFunc = await bot.message.sendPrivateMessage(
				guildId, msgID
			);
			const cmdSet: BasicConfig[] = bot.command.get( auth, MessageScope.Private );
			const unionReg: RegExp = bot.command.getUnion( auth, MessageScope.Private );
			await that.execute( messageData, sendMessage, cmdSet, limit, unionReg, true );
			bot.logger.info( `[Author: ${ authorName }][UserID: ${ userID }]: ${ content }` );
		}
	}
	
	/* 处理群聊事件 */
	private parseGroupMsg( that: Adachi ) {
		const bot = that.bot;
		return async function ( messageData: Message ) {
			that.checkAtBOT( messageData );
			const authorName = messageData.msg.author.username;
			const channelID = messageData.msg.channel_id;
			const userID = messageData.msg.author.id;
			const msgID = messageData.msg.id;
			const content = messageData.msg.content;
			
			
			const channelInfo = <sdk.IChannel>( await bot.client.channelApi.channel( channelID ) ).data;
			const auth: AuthLevel = await bot.auth.get( userID );
			const gLim: string[] = await bot.redis.getList( `adachi.group-command-limit-${ channelID }` );
			const uLim: string[] = await bot.redis.getList( `adachi.user-command-limit-${ userID }` );
			const sendMessage: msg.SendFunc = bot.message.sendGuildMessage(
				channelID, msgID );
			const cmdSet: BasicConfig[] = bot.command.get( auth, MessageScope.Group );
			const unionReg: RegExp = bot.command.getUnion( auth, MessageScope.Group );
			await that.execute( messageData, sendMessage, cmdSet, [ ...gLim, ...uLim ], unionReg, false );
			bot.logger.info( `[Author: ${ authorName }][Channel: ${ channelInfo.name }]: ${ content }` );
		}
	}
	
	/*去掉消息中的@信息*/
	private checkAtBOT( msg: Message ): boolean {
		const atBOTReg: RegExp = new RegExp( `<@!\\d+>` );
		const content: string = msg.msg.content;
		
		if ( atBOTReg.test( content ) ) {
			msg.msg.content = content
				.replace( atBOTReg, "" )
				.trim();
			return true;
		}
		return false;
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
					// await bot.message.sendMaster(msg);
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
	
	private botOnline() {
		if ( this.bot.ws.alive ) {
			this.bot.logger.info( "BOT启动成功" );
		}
	}
}