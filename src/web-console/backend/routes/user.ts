import bot from "ROOT";
import express from "express";
import { AuthLevel } from "@modules/management/auth";
import { PluginReSubs, SubInfo } from "@modules/plugin";
import { BOT } from "@modules/bot";

type UserInfo = {
	userID: string;
	avatar: string;
	nickname: string;
	botAuth: AuthLevel;
	interval: number;
	limits: string[];
	groupInfoList: ( string | MemberBaseInfo )[];
	subInfo?: string[]
}

export type GroupRole = "owner" | "admin" | "member";
export type Gender = "male" | "female" | "unknown";

export interface MemberBaseInfo {
	readonly user_id: string,
	readonly nickname: string,
	readonly card: string, //群名片
	readonly sex: Gender,
	readonly age: number,
	readonly area: string,
	readonly level: number, //等级
	readonly role: GroupRole, //权限
	readonly title: string, //头衔
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
		const userInfo = await getUserInfo( userID );
		
		res.status( 200 ).send( JSON.stringify( userInfo ) );
	} )
	.post( "/set", async ( req, res ) => {
		const userID: string = <string>req.body.target;
		const int: number = parseInt( <string>req.body.int );
		const auth = <AuthLevel>parseInt( <string>req.body.auth );
		const limits: string[] = JSON.parse( <string>req.body.limits );
		
		await bot.auth.set( userID, auth );
		await bot.interval.set( userID, "private", int );
		
		const dbKey: string = `adachi.user-command-limit-${ userID }`;
		await bot.redis.deleteKey( dbKey );
		if ( limits.length !== 0 ) {
			await bot.redis.addListElement( dbKey, ...limits );
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

/* 获取用户信息，暂时只显示Master所在频道的用户 */
async function getUserInfo( userID: string ): Promise<UserInfo> {
	
	const guildID = await bot.redis.getString( `adachi.guild-id` );
	const publicInfo = await bot.client.guildApi.guildMember( guildID, userID );
	const groupInfoList: Array<MemberBaseInfo | string> = [];
	
	// const response = await bot.client.guildApi.guildMembers(guildID);
	
	const botAuth: AuthLevel = await bot.auth.get( userID );
	const interval: number = bot.interval.get( userID, "-1" );
	const limits: string[] = await bot.redis.getList( `adachi.user-command-limit-${ userID }` );
	
	let nickname: string = ""
	let avatar: string = "";
	
	if ( publicInfo.status === 200 ) {
		//获取用户使用过的子频道ID
		const usedGroups: string[] = await bot.redis.getSet( `adachi.user-used-groups-${ userID }` );
		
		nickname = publicInfo.data.nick;
		avatar = publicInfo.data.user.avatar;
		
		for ( let el of usedGroups ) {
			const groupID: string = el;
			if ( groupID === "-1" ) {
				groupInfoList.push( "私聊方式使用" );
				continue;
			}
			groupInfoList.push( {
				user_id: publicInfo.data.user.id,
				nickname: publicInfo.data.nick,
				card: "",
				sex: "female",
				age: 18,
				area: "",
				level: 10,
				role: "member",
				title: "用户"
			} );
			
		}
	}
	return {
		userID,
		avatar,
		nickname,
		botAuth,
		interval,
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