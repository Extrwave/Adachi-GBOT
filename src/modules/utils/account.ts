/* 获取所有使用过指令的频道ID */
import { IChannel, IGuild, IMember, IUser } from "qq-guild-bot";
import bot from "ROOT";
import { __RedisKey } from "@modules/redis";
import { randomInt } from "#genshin/utils/random";

export class Account {
	guildId: string;
	account: IMember;
	
	constructor( userId: string, guildId: string = "1234567890" ) {
		this.guildId = guildId;
		this.account = {
			guild_id: guildId,
			joined_at: new Date().toString(),
			nick: "神秘用户",
			user: {
				id: userId,
				username: "神秘用户",
				avatar: "https://qq-web.cdn-go.cn/qun.qq.com_pro/4a77af80/app/create/dist/cdn/assets/images/default.png",
				bot: false,
				union_openid: "",
				union_user_account: ""
			},
			roles: [ "1" ],
			deaf: false,
			mute: false
		}
	}
}

export class GuildBase {
	id: string;
	name: string;
	icon: string;
	owner_id: string;
	owner: boolean;
	member_count: number;
	max_members: number;
	description: string;
	joined_at: number;
	channels: IChannel[];
	unionworld_id: string;
	union_org_id: string;
	
	
	constructor( id: string ) {
		this.id = id;
		this.name = "神秘频道";
		this.icon = "https://qq-web.cdn-go.cn/qun.qq.com_pro/4a77af80/app/create/dist/cdn/assets/images/default.png";
		this.owner_id = "1234567890";
		this.owner = false;
		this.member_count = 1;
		this.max_members = 100;
		this.description = "";
		this.joined_at = Date.now();
		this.channels = [];
		this.union_org_id = "";
		this.unionworld_id = "";
	}
}


/* 获取用户信息对象 */
export async function getMemberInfo( userId: string, guildId?: string ): Promise<Account> {
	try {
		const guilds: string[] = await bot.redis.getSet( `${ __RedisKey.USER_USED_GUILD }-${ userId }` );
		guildId = guildId ? guildId : guilds[randomInt( 0, guilds.length - 1 )];
		const { data } = await bot.client.guildApi.guildMember( guildId, userId );
		const obj = { guildId: guildId, account: data };
		await bot.redis.setString( `${ __RedisKey.USER_INFO }-${ userId }`, JSON.stringify( obj ), 3600 * 24 )
		return obj;
	} catch ( error ) {
		return new Account( userId, guildId );
	}
}


/* 获取用户头像 */
export async function getMemberAvatar( userID: string, guildID?: string ): Promise<string> {
	const memberInfo: Account = await getMemberInfo( userID, guildID );
	return memberInfo.account.user.avatar;
}

/* 获取频道详细信息 */
export async function getGuildBaseInfo( guildID: string ): Promise<IGuild> {
	try {
		let result = await bot.redis.getString( `${ __RedisKey.GUILD_INFO }-${ guildID }` );
		if ( result ) return <IGuild>JSON.parse( result );
		
		const { data } = await bot.client.guildApi.guild( guildID );
		await bot.redis.setString( `${ __RedisKey.GUILD_INFO }-${ guildID }`, JSON.stringify( data ), 3600 * 24 );
		return data;
	} catch ( error ) {
		return new GuildBase( guildID );
	}
}

