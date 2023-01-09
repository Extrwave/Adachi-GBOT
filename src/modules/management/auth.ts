import BotConfig from "@modules/config";
import Redis, { __RedisKey } from "@modules/redis";

/**
 * 新版权限管理设计
 * @Banned 频道封禁用户
 * @User 频道普通用户
 * @GuildManager 频道管理员
 * @GuildOwner 频道主
 * @Manager 全局管理员
 * @Master BOT拥有者
 *
 * Manager       为 Master 独有的可设置类型
 * GuildOwner    启动时自动初始化
 */
export enum AuthLevel {
	Banned,
	User,
	GuildManager,
	GuildOwner,
	Manager,
	Master
}

interface AuthorizationMethod {
	set( operator: string, target: string, guildID: string, level: AuthLevel ): Promise<void>;
	get( target: string, guildID: string ): Promise<AuthLevel>;
	opCheck( operator: string, target: string, guildID: string ): Promise<boolean | string>;
}

export default class Authorization implements AuthorizationMethod {
	private readonly master: string;
	private readonly redis: Redis;
	private static dbKey: string = `${ __RedisKey.AUTH_LEVEL }-`;
	
	constructor( config: BotConfig, redis: Redis ) {
		this.master = config.master;
		this.redis = redis;
	}
	
	public async set( operator: string, target: string, guildID: string, level: AuthLevel ): Promise<void> {
		/* 如果权限为 master 但与 setting 中的 master 不符，重置为 user */
		if ( level === AuthLevel.Master && target !== this.master ) {
			level = AuthLevel.User;
		}
		/* 仅Master可以设置全局权限 */
		if ( operator === this.master ) {
			level === AuthLevel.User ?
				/* 设置Ban或者Manager，全局仅允许这两个值存在，如果需要设置为User就删除记录 */
				await this.redis.delHash( Authorization.dbKey + target, "-1" )
				: await this.redis.setHashField( Authorization.dbKey + target, "-1", level );
		} else {
			/*如果非Master设置管理，就是设置频道管理员 */
			level = level === AuthLevel.Manager ? AuthLevel.GuildManager : level;
			await this.redis.setHashField( Authorization.dbKey + target, guildID, level );
		}
	}
	
	public async get( target: string, guildID: string ): Promise<AuthLevel> {
		if ( target === this.master ) {
			return AuthLevel.Master;
		}
		/* 优先判断全局管理权限 */
		const GAuth = await this.redis.getHashField( Authorization.dbKey + target, "-1" );
		const Auth = await this.redis.getHashField( Authorization.dbKey + target, guildID );
		return GAuth ? parseInt( GAuth ) : Auth ? parseInt( Auth ) : AuthLevel.User;
	}
	
	public async opCheck( operator: string, target: string, guildID: string ): Promise<boolean | string> {
		if ( target === operator ) {
			return "亲，不能对自己执行权限操作";
		}
		const oAuth: AuthLevel = await this.get( operator, guildID );
		const tAuth: AuthLevel = await this.get( target, guildID );
		if ( oAuth <= tAuth ) {
			return `操作用户 [ <@!${ target }> ] 失败：权限不足`;
		}
		return true;
	}
}