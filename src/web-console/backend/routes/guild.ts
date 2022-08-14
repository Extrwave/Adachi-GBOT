/**
 Author: Ethereal
 CreateTime: 2022/8/13
 */
import bot from "ROOT";
import express from "express";
import { AuthLevel } from "@modules/management/auth";
import { IGuild, IMember } from "qq-guild-bot";
import { scheduleJob } from "node-schedule";

export type GuildRole = "owner" | "admin" | "member" | "childadmin";

type GuildData = {
	guildId: string;
	guildAvatar: string;
	guildName: string;
	guildAuth: AuthLevel;
	guildRole: GuildRole;
	interval: number;
	limits: string[];
}

export default express.Router()
	.get( "/list", async ( req, res ) => {
		const page = parseInt( <string>req.query.page ); // 当前第几页
		const length = parseInt( <string>req.query.length ); // 页长度
		
		if ( !page || !length ) {
			res.status( 400 ).send( { code: 400, data: {}, msg: "Error Params" } );
			return;
		}
		
		const groupId = <string>req.query.groupId || "";
		
		try {
			//获取BOT进入频道列表
			let glMap = await bot.redis.getSet( `adachi.guild-used` );
			glMap = glMap
				// 过滤条件：id
				.filter( ( key ) => {
					return groupId ? key === groupId : true;
				} )
				// 按入群时间排序
				.sort( ( a, b ) => {
					return parseInt( a ) - parseInt( b );
				} )
				.slice( ( page - 1 ) * length, page * length )
			
			const guildInfos: GuildData[] = [];
			for ( const id of glMap ) {
				guildInfos.push( await getGroupInfo( id ) );
			}
			
			const cmdKeys: string[] = bot.command.cmdKeys;
			res.status( 200 ).send( { code: 200, data: { guildInfos, cmdKeys }, total: glMap.length } );
		} catch ( error ) {
			res.status( 500 ).send( { code: 500, data: {}, msg: "Server Error" } );
		}
		
	} )
	.get( "/info", async ( req, res ) => {
		const guildId = <string>req.query.groupId;
		if ( guildId ) {
			res.status( 400 ).send( { code: 400, data: {}, msg: "Error Params" } );
			return;
		}
		
		const glMap = await bot.redis.getSet( `adachi.guild-used` );
		if ( !glMap.includes( guildId ) ) {
			res.status( 404 ).send( { code: 404, data: {}, msg: "NotFound" } );
			return
		}
		
		const guildInfo = await getGroupInfo( guildId, );
		res.status( 200 ).send( { code: 200, data: guildInfo } );
	} )
	.post( "/set", async ( req, res ) => {
		const guildId: string = <string>req.body.target;
		const int: number = parseInt( <string>req.body.int );
		const auth = <1 | 2>parseInt( <string>req.body.auth );
		const limits: string[] = JSON.parse( <string>req.body.limits );
		
		/* 封禁相关 */
		const banDbKey = "adachi.banned-guild";
		if ( auth === 1 ) {
			await bot.redis.addListElement( banDbKey, guildId );
		} else {
			await bot.redis.delListElement( banDbKey, guildId );
		}
		
		await bot.interval.set( guildId, "private", int );
		
		const dbKey: string = `adachi.group-command-limit-${ guildId }`;
		await bot.redis.deleteKey( dbKey );
		if ( limits.length !== 0 ) {
			await bot.redis.addListElement( dbKey, ...limits );
		}
		
		res.status( 200 ).send( "success" );
	} );


async function getGroupInfo( guildId: string ): Promise<GuildData> {
	
	//BOT自身ID
	const botId = await bot.redis.getString( `adachi.user-bot-id` );
	//Guild信息,BOT member信息
	const tempGinfo = await <IGuild>( await bot.client.guildApi.guild( guildId ) ).data;
	const botGroupInfo = await <IMember>( await bot.client.guildApi.guildMember( guildId, botId ) ).data;
	
	const isBanned: boolean = await bot.redis.existListElement(
		"adachi.banned-guild", guildId
	);
	const guildAuth = isBanned ? 1 : 2;
	
	const interval: number = bot.interval.get( guildId, "-1" );
	const limits: string[] = await bot.redis.getList( `adachi.group-command-limit-${ guildId }` );
	
	let role: GuildRole = "member";
	if ( botGroupInfo.roles.includes( "4" ) ) {
		role = "owner";
	} else if ( botGroupInfo.roles.includes( "2" ) ) {
		role = "admin";
	} else if ( botGroupInfo.roles.includes( "5" ) ) {
		role = "childadmin";
	}
	
	return {
		guildId,
		guildName: tempGinfo.name,
		guildAvatar: tempGinfo.icon,
		guildAuth,
		guildRole: role,
		interval,
		limits
	}
}