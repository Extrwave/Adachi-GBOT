/* 获取所有使用过指令的频道ID */
import { IMember } from "qq-guild-bot";
import bot from "ROOT";

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
	const guilds: string[] = await bot.redis.getSet( `adachi.user-used-groups-${ userID }` );
	if ( !guildID ) {
		for ( let guild of guilds ) {
			/* 排除只是在私聊使用过，没有群聊使用过 */
			if ( guild !== "-1" ) {
				const res = await getMemberInfoInGuild( userID, guild );
				if ( res ) { //没有获取到就continue
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
			return { guildID: guildID, account: response.data };
		} else {
			await bot.redis.delSetMember( `adachi.user-used-groups-${ userID }`, guildID );
		}
	} catch ( err ) {
		//如果获取失败，隐藏错误输出
	}
}

/* 获取用户头像 */
export async function getMemberAvatar( userID: string, guildID?: string ): Promise<string | undefined> {
	const memberInfo: Account | undefined = await getMemberInfo( userID, guildID );
	if ( memberInfo ) {
		return memberInfo.account.user.avatar;
	}
}

/* 获取频道详细信息 */
export async function getGuildBaseInfo( guildID: string ): Promise<GuildBaseInfo | undefined> {
	try {
		const response = await bot.client.guildApi.guild( guildID );
		if ( response.status === 200 && response.data !== null ) {
			return response.data;
		}
	} catch ( err ) {
		//如果获取失败，隐藏错误输出
	}
}

