/* 获取所有使用过指令的频道ID */
import { IMember, IUser } from "qq-guild-bot";
import bot from "ROOT";

interface Account {
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

/* 泛获取用户信息对象，用户加入频道顺序第一个中的用户信息 */
export async function getMemberInfo( userID: string ): Promise<Account | undefined> {
	const guilds: string[] = await bot.redis.getSet( `adachi.guild-used` );
	for ( let guild of guilds ) {
		let response;
		try {
			response = await bot.client.guildApi.guildMember( guild, userID );
			if ( response.status === 200 && response.data.user !== null ) {
				return { guildID: guild, account: response.data };
			}
		} catch ( err ) {
			//如果获取失败，隐藏错误输出
		}
	}
}

/* 精准获取用户信息对象 */
export async function getMemberInfoInGuild( userID: string, guildID: string ): Promise<Account | undefined> {
	try {
		const response = await bot.client.guildApi.guildMember( guildID, userID );
		if ( response.status === 200 && response.data.user !== null ) {
			return { guildID: guildID, account: response.data };
		}
	} catch ( err ) {
		//如果获取失败，隐藏错误输出
	}
}

/* 获取用户所在的第一个频道ID */
export async function getGidMemberIn( userID: string ): Promise<string | undefined> {
	const memberInfo: Account | undefined = await getMemberInfo( userID );
	if ( memberInfo ) {
		return memberInfo.guildID;
	}
}

/* 获取用户头像 */
export async function getMemberAvatar( userID: string ): Promise<string | undefined> {
	const memberInfo: Account | undefined = await getMemberInfo( userID );
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