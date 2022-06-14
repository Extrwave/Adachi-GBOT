import BotConfig from "./config";
import { configure, addLayout, getLogger, Configuration, Appender, Logger } from "log4js";
import { parseZone } from "moment";

function getTimeString( date: Date ): string {
	return parseZone( date ).local().format( "HH:mm:ss.SSS" );
}

export default class WebConfiguration {
	private readonly logger: Logger;
	private readonly tcpLoggerPort: number;
	
	constructor( config: BotConfig ) {
		this.setNetworkLayout();
		this.tcpLoggerPort = config.webConsole.tcpLoggerPort;
		const cfg = this.getConfiguration( config.webConsole.enable, config.logLevel );
		configure( cfg );
		this.logger = getLogger( "[Adachi-GBot]" );
	}
	
	private setNetworkLayout(): void {
		addLayout( "JSON", config => event => JSON.stringify( {
			category: event.categoryName,
			level: event.level.levelStr,
			color: event.level.colour,
			message: event.data[0],
			time: getTimeString( event.startTime )
		} ) );
	}
	
	private getConfiguration( enable: boolean, logLevel: BotConfig["logLevel"] ): Configuration {
		/* 日志输出至控制台 */
		const console: Appender = { type: "console" };
		/* 日志输出至TCP */
		const network: Appender = {
			type: "tcp",
			port: this.tcpLoggerPort,
			endMsg: "__ADACHI__",
			layout: { type: "JSON" }
		};
		/* 日志输出至文件 */
		const logFile: Appender = {
			type: "dateFile",
			filename: "logs/bot",
			pattern: "yyyy-MM-dd.log",
			alwaysIncludePattern: true,
			layout: { type: "JSON" }
		};
		
		const Default = { appenders: [ "console" ], level: "off" };
		const Device = {
			appenders: [ "logFile", enable ? "network" : "console" ],
			level: logLevel
		};
		
		return <Configuration>{
			appenders: { console, network, logFile },
			categories: {
				default: Default,
				"[Adachi-GBot]": Device
			}
		};
	}
	
	public getLogger(): Logger {
		return this.logger;
	}
}