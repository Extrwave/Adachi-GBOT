import express from "express";
import bot from "ROOT";
import { Md5 } from "md5-typescript";
import { getTokenByRequest } from "@web-console/backend/utils/request";
import { validateToken } from "@web-console/backend/jwt";


export default express.Router()
	.get( "/", ( req, res ) => {
		const token: string = getTokenByRequest( req ) || "";
		const valid = validateToken( bot.config.webConsole.jwtSecret, token );
		if ( valid ) {
			res.status( 200 ).send( "Success" );
		} else {
			res.status( 403 ).send( "Token Expired" );
		}
	} )
	.post( "/password", ( req, res ) => {
		const pwd = req.body.pwd;
		
		if ( pwd === bot.config.webConsole.adminPwd || pwd === Md5.init( bot.config.webConsole.adminPwd ) ) {
			res.status( 200 ).send( { code: 200, data: {}, msg: "Success" } );
		} else {
			res.status( 403 ).send( { code: 403, data: {}, msg: "Password is incorrect" } );
		}
	} );