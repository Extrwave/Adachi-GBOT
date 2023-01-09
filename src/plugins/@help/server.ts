import { Logger } from "log4js";
import express from "express";
import bot from "ROOT";
import { __RedisKey } from "@modules/redis";

const HelpRoute = express.Router().get( "/", async ( req, res ) => {
	const data = await bot.redis.getString( __RedisKey.HELP_DATA );
	res.send( JSON.parse( data ) );
} )

export function createServer( port: number, logger: Logger ): void {
	const app = express();
	app.use( express.static( __dirname ) );
	app.use( "/api/help", HelpRoute );
	app.listen( port, () => {
		logger.debug( `[ @help ]插件 Express 服务已启动，端口为 ${ port }` );
	} );
}