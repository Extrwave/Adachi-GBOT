/* 获取所有使用过指令的频道ID */
import { IMember, IUser } from "qq-guild-bot";
import bot from "ROOT";

interface Account {
	guildID: string,
	account: IMember
}

/* 获取用户信息对象 */
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

/* 获取用户所在频道，第一个即可 */
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