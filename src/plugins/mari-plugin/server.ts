import { Logger } from "log4js";
import MariPluginConfig from "./module/config";
import express from "express";
import * as r from "./routes"

export function createServer( config: MariPluginConfig, logger: Logger ): void {
	const app = express();
	app.use( express.static( __dirname ) );
	
	app.use( "/api/chara", r.CharaRouter );
	
	app.listen( config.serverPort, () => {
		logger.info( "mari-plugin Express服务已启动，port: " + config.serverPort );
	} );
}