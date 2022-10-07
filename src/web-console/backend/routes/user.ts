import bot from "ROOT";
import express from "express";
import { AuthLevel } from "@modules/management/auth";
import { PluginReSubs, SubInfo } from "@modules/plugin";
import { BOT } from "@modules/bot";
import { getGuildBaseInfo, getMemberInfo } from "@modules/utils/account";

type UserInfo = {
	userID: string;
	avatar: string;
	nickname: string;
	botAuth: AuthLevel;
	guildUsed: string[];
	limits: { key: string, guild: string }[];
	groupInfoList: ( string | MemberInGuildInfo )[];
	subInfo?: string[]
}

/**
 * Role 字段
 * 4 频道主
 * 2 管理员
 * 5 子管理员
 * 1 成员
 */
export interface MemberInGuildInfo {
	readonly user_id: string,
	readonly guild_id: string,
	readonly guild_name: string,
	readonly username: string, //用户昵称
	readonly nickname: string, //频道中的昵称
	readonly auth: AuthLevel //身份权限
}

export default express.Router()
	.get( "/list", async ( req, res ) => {
		const page = parseInt( <string>req.query.page ); // 当前第几页
		const length = parseInt( <string>req.query.length ); // 页长度
		
		if ( !page || !length ) {
			res.status( 400 ).send( { code: 400, data: {}, msg: "Error Params" } );
			return;
		}
		
		const userId = <string>req.query.userId || "";
		/* 是否存在订阅，1 有 2 无 */
		const sub = parseInt( <string>req.query.sub );
		
		try {
			/* 用户订阅信息 */
			const userSubData: Record<string, string[]> = await formatSubUsers( bot );
			
			let userData: string[] = await bot.redis.getKeysByPrefix( "adachi.user-used-groups-" );
			userData = userData.map( ( userKey: string ) => <string>userKey.split( "-" ).pop() )
			
			const cmdKeys: string[] = bot.command.cmdKeys;
			
			// 过滤条件：id
			if ( userId ) {
				userData = userData.filter( ( userKey: string ) => userKey.includes( userId ) );
			}
			/* 过滤条件：订阅 */
			if ( sub === 1 ) {
				userData = userData.filter( ( userKey: string ) => Object.keys( userSubData ).includes( userKey ) );
			} else if ( sub === 2 ) {
				userData = userData.filter( ( userKey: string ) => !Object.keys( userSubData ).includes( userKey ) );
			}
			
			/* 一次获取10个用户的个人信息 */
			const filterUserKeys = userData.slice( ( page - 1 ) * length, page * length );
			
			let userInfos: UserInfo[] = []
			
			for ( const userKey of filterUserKeys ) {
				const userInfo: UserInfo = await getUserInfo( userKey );
				userInfos.push( { ...userInfo, subInfo: userSubData[userKey] || [] } );
				
			}
			
			userInfos = userInfos.sort( ( prev, next ) => next.botAuth - prev.botAuth );
			
			res.status( 200 ).send( { code: 200, data: { userInfos, cmdKeys }, total: userData.length } );
		} catch ( error ) {
			res.status( 500 ).send( { code: 500, data: {}, msg: "Server Error" } );
		}
		
	} )
	.get( "/info", async ( req, res ) => {
		const userID: string = <string>req.query.id;
		if ( userID ) {
			res.status( 400 ).send( { code: 400, data: {}, msg: "Error Params" } );
			return;
		}
		
		const userInfo = await getUserInfo( userID );
		
		res.status( 200 ).send( JSON.stringify( userInfo ) );
	} )
	.post( "/set", async ( req, res ) => {
		const operator: string = bot.config.master;
		const target: string = <string>req.body.target;
		const auth = <AuthLevel>parseInt( <string>req.body.auth );
		const limits: { key: string, guild: string }[] = JSON.parse( <string>req.body.limits );
		
		await bot.auth.set( operator, target, "-1", auth );
		
		//删除原有的限制
		const dbKey: string[] = await bot.redis.getKeysByPrefix( `adachi.user-command-limit-${ target }*` );
		await bot.redis.deleteKey( ...dbKey );
		//设置改变后的限制
		for ( let limit of limits ) {
			const dbKey: string = `adachi.user-command-limit-${ target }-${ limit.guild }`;
			await bot.redis.addSetMember( dbKey, limit.key );
		}
		res.status( 200 ).send( "success" );
	} )
	.delete( "/sub/remove", async ( req, res ) => {
		const userId = <string>req.query.userId;
		try {
			if ( !userId ) {
				res.status( 400 ).send( { code: 400, data: [], msg: "Error Params" } );
				return;
			}
			for ( const plugin in PluginReSubs ) {
				try {
					await PluginReSubs[plugin].reSub( userId, bot );
				} catch ( error ) {
					bot.logger.error( `插件${ plugin }取消订阅事件执行异常：${ <string>error }` )
				}
			}
			res.status( 200 ).send( { code: 200, data: {}, msg: "Success" } );
		} catch ( error ) {
			res.status( 500 ).send( { code: 500, data: [], msg: "Server Error" } );
		}
	} )
	.delete( "/remove", async ( req, res ) => {
		const userId = <string>req.query.userId;
		const dbKeys = await bot.redis.getKeysByPrefix( `*${ userId }*` );
		try {
			if ( !userId ) {
				res.status( 400 ).send( { code: 400, data: [], msg: "Error Params" } );
				return;
			}
			//清除使用记录
			await bot.redis.deleteKey( ...dbKeys );
			res.status( 200 ).send( { code: 200, data: {}, msg: "Success" } );
		} catch ( error ) {
			res.status( 500 ).send( { code: 500, data: [], msg: "Server Error" } );
		}
	} );

/* 获取用户信息，暂时只显示Master所在频道的用户 */
async function getUserInfo( userID: string ): Promise<UserInfo> {
	
	/* 此处获取用户信息逻辑已更改 */
	const groupInfoList: Array<MemberInGuildInfo | string> = [];
	const limits: { key: string, guild: string }[] = [];
	const guilds = ( await bot.redis.getKeysByPrefix( `adachi.user-command-limit-${ userID }*` ) );
	const guildIds = guilds.map( value => {
		return value.split( "-" )[4];
	} )
	
	for ( let guild of guildIds ) {
		const keys = await bot.redis.getSet( `adachi.user-command-limit-${ userID }-${ guild }` );
		keys.forEach( value => {
			limits.push( { key: value, guild: guild } );
		} )
	}
	
	/* 如果为全局管理员，则在首页上显示，否则只在详情页展示 */
	const botAuth: AuthLevel = await bot.auth.get( userID, "-1" );
	//获取用户使用过的频道ID
	const usedGuilds: string[] = await bot.redis.getSet( `adachi.user-used-groups-${ userID }` );
	let avatar;
	let nickname;
	
	for ( let el of usedGuilds ) {
		if ( el === "-1" ) {
			groupInfoList.push( "私聊方式使用" );
			continue;
		}
		const memberAuth = await bot.auth.get( userID, el );
		const guildBaseInfo = await getGuildBaseInfo( el );
		const guildMemberInfo = await getMemberInfo( userID, el );
		const gName = guildBaseInfo ? guildBaseInfo.name : "Unknown";
		/* 获取用户在每个频道内的信息 */
		if ( guildMemberInfo?.account ) {
			nickname = guildMemberInfo.account.user.username;
			avatar = guildMemberInfo.account.user.avatar;
			groupInfoList.push( {
				user_id: guildMemberInfo.account.user.id,
				guild_id: el,
				guild_name: gName,
				username: guildMemberInfo.account.user.username,
				nickname: guildMemberInfo.account.nick,
				auth: memberAuth
			} );
		}
	}
	if ( !avatar )
		avatar = "https://docs.adachi.top/images/adachi.png";
	if ( !nickname )
		nickname = "已退出";
	
	return {
		userID,
		avatar,
		nickname,
		botAuth,
		guildUsed: usedGuilds.filter( value => {
			return value !== "-1";
		} ),
		limits,
		groupInfoList
	}
}

/* 生成订阅用户id列表 */
async function formatSubUsers( bot: BOT ): Promise<Record<string, string[]>> {
	const userSubs: Record<string, string[]> = {};
	
	for ( const pluginName in PluginReSubs ) {
		const { subs } = PluginReSubs[pluginName];
		try {
			const subList: SubInfo[] = await subs( bot );
			if ( subList ) {
				for ( const subItem of subList ) {
					for ( const user of subItem.users ) {
						if ( userSubs[user] ) {
							userSubs[user].push( `${ pluginName }-${ subItem.name }` );
						} else {
							userSubs[user] = [ `${ pluginName }-${ subItem.name }` ];
						}
					}
				}
			}
		} catch ( error ) {
			bot.logger.error( `获取插件订阅信息异常: ${ <string>error }` );
		}
	}
	
	return userSubs;
}