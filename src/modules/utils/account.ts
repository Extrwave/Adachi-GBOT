/* 获取所有使用过指令的频道ID */
import { IMember } from "qq-guild-bot";
import bot from "ROOT";
import { __RedisKey } from "@modules/redis";

export interface Account {
	guildID: string,
	account: IMember
}

interface GuildBaseInfo {
	id: string;
	name: string;
	icon: string;
	owner_id: string;
	owner: boolean;
	member_count: number;
	max_members: number;
	description: string;
	joined_at: number;
}

/* 获取用户信息对象 */
export async function getMemberInfo( userID: string, guildID?: string ): Promise<Account | undefined> {
	const guilds: string[] = await bot.redis.getSet( `${ __RedisKey.USER_USED_GUILD }-${ userID }` );
	if ( !guildID ) { //泛获取用户信息
		let result = await bot.redis.getString( `${ __RedisKey.USER_INFO }-${ userID }` );
		if ( result ) return <Account>JSON.parse( result );
		
		for ( let guild of guilds ) {
			/* 排除只是在私聊使用过，没有群聊使用过 */
			if ( guild !== "-1" ) {
				const res = await getMemberInfoInGuild( userID, guild );
				if ( res ) {
					await bot.redis.setString( `${ __RedisKey.USER_INFO }-${ userID }`, JSON.stringify( res ), 3600 * 24 );
					return res;
				}
			}
		}
	} else {
		return await getMemberInfoInGuild( userID, guildID );
	}
}

/* 精准获取用户信息对象 */
async function getMemberInfoInGuild( userID: string, guildID: string ): Promise<Account | undefined> {
	try {
		const response = await bot.client.guildApi.guildMember( guildID, userID );
		if ( response.status === 200 && response.data.user !== null ) {
			const obj = { guildID: guildID, account: response.data };
			await bot.redis.setString( `${ __RedisKey.USER_INFO }-${ userID }`, JSON.stringify( obj ), 3600 * 24 )
			return obj;
		} else {
			await bot.redis.delSetMember( `${ __RedisKey.USER_USED_GUILD }-${ userID }`, guildID );
		}
	} catch ( err ) {
		bot.logger.debug( err );
	}
}

/* 获取用户头像 */
export async function getMemberAvatar( userID: string, guildID?: string ): Promise<string> {
	const memberInfo: Account | undefined = await getMemberInfo( userID, guildID );
	if ( memberInfo ) {
		return memberInfo.account.user.avatar;
	} else {
		return "https://qq-web.cdn-go.cn/qun.qq.com_pro/4a77af80/app/create/dist/cdn/assets/images/default.png";
	}
}

/* 获取频道详细信息 */
export async function getGuildBaseInfo( guildID: string ): Promise<GuildBaseInfo | undefined> {
	try {
		let result = await bot.redis.getString( `${ __RedisKey.GUILD_INFO }-${ guildID }` );
		if ( result ) return <GuildBaseInfo>JSON.parse( result );
		
		const response = await bot.client.guildApi.guild( guildID );
		if ( response.status === 200 && response.data !== null ) {
			await bot.redis.setString( `${ __RedisKey.GUILD_INFO }-${ guildID }`, JSON.stringify( response.data ), 3600 * 24 );
			return response.data;
		}
	} catch ( err ) {
		bot.logger.debug( err );
	}
}

