import { Logger } from "log4js";
import express from "express";
import AnalysisRouter from "./routes/analysis-route"

export function createServer( port: number, logger: Logger ): void {
	const app = express();
	app.use( express.static( __dirname ) );
	
	app.use( "/api/analysis", AnalysisRouter );
	
	app.listen( port, () => {
		logger.info( `[ genshin_draw_analysis ]插件 Express 服务器已启动, 端口为: ${ port }` );
	} );
}