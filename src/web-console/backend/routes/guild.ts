/**
 Author: Ethereal
 CreateTime: 2022/8/13
 */
import bot from "ROOT";
import express from "express";
import { AuthLevel } from "@modules/management/auth";
import { IMember } from "qq-guild-bot";
import { getGuildBaseInfo } from "@modules/utils/account";
import { __RedisKey } from "@modules/redis";

type GuildData = {
	guildId: string;
	guildAvatar: string;
	guildName: string;
	guildAuth: 1 | 2;
	guildRole: AuthLevel;
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
			let glMap = await bot.redis.getSet( __RedisKey.GUILD_USED );
			const dateGlMap = glMap
				// 过滤条件：id
				.filter( ( key ) => {
					return groupId ? key === groupId : true;
				} )
				.slice( ( page - 1 ) * length, page * length )
			
			const pageGuildData = glMap.slice( ( page - 1 ) * length, page * length );
			
			const guildInfos: GuildData[] = [];
			for ( const id of pageGuildData ) {
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
		
		const glMap = await bot.redis.getSet( __RedisKey.GUILD_USED );
		if ( !glMap.includes( guildId ) ) {
			res.status( 404 ).send( { code: 404, data: {}, msg: "NotFound" } );
			return
		}
		
		const guildInfo = await getGroupInfo( guildId, );
		res.status( 200 ).send( { code: 200, data: guildInfo } );
	} )
	.post( "/set", async ( req, res ) => {
		const guildId: string = <string>req.body.target;
		const auth = <1 | 2>parseInt( <string>req.body.auth );
		
		/* 封禁相关 */
		const banDbKey = __RedisKey.BANED_GUILD;
		if ( auth === 1 ) {
			await bot.redis.addSetMember( banDbKey, guildId );
		} else {
			await bot.redis.delSetMember( banDbKey, guildId );
		}
		
		res.status( 200 ).send( "success" );
	} );


async function getGroupInfo( guildId: string ): Promise<GuildData> {
	
	//BOT自身ID
	const botId = await bot.redis.getString( __RedisKey.USER_BOT_ID );
	//Guild信息,BOT member信息
	const tempGinfo = await getGuildBaseInfo( guildId );
	const botGroupInfo = await <IMember>( await bot.client.guildApi.guildMember( guildId, botId ) ).data;
	
	const isBanned: boolean = await bot.redis.existSetMember(
		__RedisKey.BANED_GUILD, guildId
	);
	const guildAuth = isBanned ? 1 : 2;
	
	let role: AuthLevel = AuthLevel.User;
	if ( botGroupInfo.roles.includes( "4" ) ) {
		role = AuthLevel.GuildOwner;
	} else if ( botGroupInfo.roles.includes( "2" ) ) {
		role = AuthLevel.GuildManager;
	}
	
	return {
		guildId,
		guildName: tempGinfo ? tempGinfo.name : "Unknown",
		guildAvatar: tempGinfo ? tempGinfo.icon : "https://docs.adachi.top/images/adachi.png",
		guildAuth,
		guildRole: role,
	}
}