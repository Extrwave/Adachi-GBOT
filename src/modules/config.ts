import FileManagement from "@modules/file";
import { randomSecret } from "./utils";

export default class BotConfig {
	public readonly appID: string;
	public readonly token: string;
	public readonly sandbox: boolean;
	public readonly area: string;
	public readonly master: string;
	public readonly header: string;
	public readonly atBot: boolean;
	public readonly dbPort: number;
	public readonly dbPassword: string;
	public readonly countThreshold: number;
	public readonly helpPort: number;
	public readonly helpMessageStyle: string;
	public readonly logLevel: "trace" | "debug" | "info" | "warn" |
		"error" | "fatal" | "mark" | "off";
	
	public readonly webConsole: {
		readonly enable: boolean;
		readonly adminName: string;
		readonly adminPwd: string;
		readonly consolePort: number;
		readonly tcpLoggerPort: number;
		readonly logHighWaterMark: number,
		readonly jwtSecret: string
	};
	
	public readonly autoChat: {
		readonly enable: boolean;
		readonly type: number;
		readonly secretId: string;
		readonly secretKey: string;
	}
	
	static initObject = {
		tip: "前往 https://docs.ethreal.cn 查看配置详情",
		appID: "appID",
		token: "token",
		sandbox: false,
		master: "masterID",
		area: "private",
		header: "/",
		atBot: false,
		dbPort: 6379,
		dbPassword: "",
		countThreshold: 60,
		helpPort: 54919,
		helpMessageStyle: "message",
		logLevel: "debug",
		webConsole: {
			enable: false,
			adminName: "admin",
			adminPwd: "admin",
			consolePort: 9999,
			tcpLoggerPort: 54921,
			logHighWaterMark: 64,
			jwtSecret: randomSecret( 16 )
		},
		autoChat: {
			tip1: "type参数说明：1为青云客，2为腾讯NLP（需要secret）",
			enable: false,
			type: 1,
			secretId: "xxxxx",
			secretKey: "xxxxx"
		}
	};
	
	constructor( file: FileManagement ) {
		const config: any = file.loadYAML( "setting" );
		const checkFields: Array<keyof BotConfig> = [
			"appID", "token", "dbPassword",
			"atBot", "autoChat"
		];
		
		for ( let key of checkFields ) {
			if ( config[key] === undefined ) {
				config[key] = BotConfig.initObject[key];
			}
		}
		file.writeYAML( "setting", config );
		
		this.appID = config.appID;
		this.token = config.token;
		this.sandbox = config.sandbox;
		this.master = config.master;
		this.header = config.header;
		this.dbPort = config.dbPort;
		this.dbPassword = config.dbPassword;
		this.atBot = config.atBot;
		this.helpPort = config.helpPort;
		this.countThreshold = config.countThreshold;
		this.webConsole = {
			enable: config.webConsole.enable,
			adminName: config.webConsole.adminName,
			adminPwd: config.webConsole.adminPwd,
			consolePort: config.webConsole.consolePort,
			tcpLoggerPort: config.webConsole.tcpLoggerPort,
			logHighWaterMark: config.webConsole.logHighWaterMark,
			jwtSecret: config.webConsole.jwtSecret
		};
		
		this.autoChat = {
			enable: config.autoChat.enable,
			type: config.autoChat.type,
			secretId: config.autoChat.secretId,
			secretKey: config.autoChat.secretKey,
		}
		
		/* 公域Ark消息模板需要申请才可以使用 */
		const helpList: string[] = [ "message", "embed", "ark", "card" ];
		this.helpMessageStyle = helpList.includes( config.helpMessageStyle )
			? config.helpMessageStyle : "message";
		
		const areaList: string[] = [ "private", "public" ];
		this.area = areaList.includes( config.area ) ? config.area : "private";
		
		const logLevelList: string[] = [
			"trace", "debug", "info", "warn",
			"error", "fatal", "mark", "off"
		];
		this.logLevel = logLevelList.includes( config.logLevel )
			? config.logLevel : "info";
	}
}