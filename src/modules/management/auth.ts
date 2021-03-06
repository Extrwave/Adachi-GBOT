import BotConfig from "@modules/config";
import Database from "@modules/database";

export enum AuthLevel {
    Banned,
    User,
    Manager,
    Master
}

interface AuthorizationMethod {
    set( userID: string, level: AuthLevel ): Promise<void>;

    get( userID: string ): Promise<AuthLevel>;

    check( userID: string, limit: AuthLevel ): Promise<boolean>;
}

export default class Authorization implements AuthorizationMethod {
    private readonly master: string;
    private readonly redis: Database;

    constructor( config: BotConfig, redis: Database ) {
        this.master = config.master;
        this.redis = redis;
    }

    private static dbKey( userID: string ): string {
        return `adachi.auth-level-${ userID }`;
    }

    public async set( userID: string, level: AuthLevel ): Promise<void> {
        await this.redis.setString(Authorization.dbKey(userID), level);
    }

    public async get( userID: string ): Promise<AuthLevel> {
        if ( userID === this.master ) {
            return AuthLevel.Master;
        }
        const auth: string | null = await this.redis.getString(Authorization.dbKey(userID));
        return !auth ? AuthLevel.User : parseInt(auth);
    }

    public async check( userID: string, limit: AuthLevel ): Promise<boolean> {
        const auth: AuthLevel = await this.get(userID);
        return auth >= limit;
    }
}