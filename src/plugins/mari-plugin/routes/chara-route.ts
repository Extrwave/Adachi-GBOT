import bot from "ROOT";
import express from "express";

export default express.Router().get( "/", async ( req, res ) => {
	const uid: string = <string>req.query.uid;
	const data = await bot.redis.getString( `mari-plugin.chara-detail-${ uid }` );
	res.send( { data: JSON.parse( data ) } );
} );