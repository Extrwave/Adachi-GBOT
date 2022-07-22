import FileManagement from "@modules/file";

export default class BotConfig {
	public readonly appID: string;
	public readonly token: string;
	public readonly sandbox: boolean;
	public readonly area: string;
	public readonly master: string;
	public readonly header: string;
	public readonly atUser: boolean;
	public readonly autoChat: boolean;
	public readonly dbPort: number;
	public readonly dbPassword: string;
	public readonly countThreshold: number;
	public readonly groupIntervalTime: number;
	public readonly privateIntervalTime: number;
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
		readonly jwtSecret: string;
	};
	public readonly qiniu: {
		readonly QAccessKey: string;
		readonly QSecretKey: string;
		readonly CloudUrl: string;
		readonly UploadUrl: string;
		readonly Bucket: string;
	}
	
	
	static initObject = {
		tip: "前往 https://adachi.ethreal.cn 查看配置详情",
		appID: "appID",
		token: "token",
		sandbox: false,
		master: "masterID",
		area: "private",
		header: "/",
		atUser: false,
		autoChat: false,
		dbPort: 6379,
		dbPassword: "",
		countThreshold: 60,
		groupIntervalTime: 1500,
		privateIntervalTime: 2000,
		helpPort: 54919,
		helpMessageStyle: "message",
		logLevel: "info",
		webConsole: {
			enable: false,
			adminName: "admin",
			adminPwd: "admin",
			consolePort: 80,
			tcpLoggerPort: 54921,
			jwtSecret: "Secret"
		},
		qiniu: {
			tip: [ "根据对象存储空间修改UploadUrl",
				"华东空间使用 upload.qiniup.com",
				"华北空间使用 upload-z1.qiniup.com",
				"华南空间使用 upload-z2.qiniup.com",
				"北美空间使用 upload-na0.qiniup.com"
			],
			QAccessKey: "AK",
			QSecretKey: "SK",
			CloudUrl: "http://example.com",
			UploadUrl: "upload-z2.qiniup.com",
			Bucket: "default"
		}
	};
	
	constructor( file: FileManagement ) {
		const config: any = file.loadYAML( "setting" );
		const checkFields: Array<keyof BotConfig> = [ "appID", "token", "dbPassword", "autoChat", "helpPort" ];
		
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
		this.atUser = config.atUser;
		this.autoChat = config.autoChat;
		this.helpPort = config.helpPort;
		this.groupIntervalTime = config.groupIntervalTime;
		this.privateIntervalTime = config.privateIntervalTime;
		this.countThreshold = config.countThreshold;
		this.webConsole = {
			enable: config.webConsole.enable,
			adminName: config.webConsole.adminName,
			adminPwd: config.webConsole.adminPwd,
			consolePort: config.webConsole.consolePort,
			tcpLoggerPort: config.webConsole.tcpLoggerPort,
			jwtSecret: config.webConsole.jwtSecret
		};
		this.qiniu = {
			QAccessKey: config.qiniu.QAccessKey,
			QSecretKey: config.qiniu.QSecretKey,
			CloudUrl: config.qiniu.CloudUrl,
			UploadUrl: config.qiniu.UploadUrl,
			Bucket: config.qiniu.Bucket
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