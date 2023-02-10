import Database from "@modules/redis";

/**
Author: Ethereal
CreateTime: 2022/7/27
 */

interface UIDResult {
	info: number | string;
	stranger: boolean;
	self: boolean;
}

export function isAt( message: string ): string | undefined {
	const res: RegExpExecArray | null = /<@!(?<id>\d+)>/.exec( message );
	return res?.groups?.id;
}

export async function getUID( data: string, userID: string, redis: Database, atID?: string ): Promise<UIDResult> {
	if ( !data ) {
		const uid: string = await redis.getString( `silvery-star.user-bind-uid-${ userID }` );
		const info = uid.length === 0 ? "您还未绑定游戏UID" : parseInt( uid );
		return { info, stranger: false, self: true };
	} else if ( atID ) {
		const uid: string = await redis.getString( `silvery-star.user-bind-uid-${ atID }` );
		const info = uid.length === 0 ? `用户 ${ atID } 未绑定游戏UID` : parseInt( uid );
		return { info, stranger: false, self: false };
	} else {
		return { info: parseInt( data ), stranger: true, self: false };
	}
}