import { AuthLevel } from "@modules/management/auth";
import { BasicConfig, InputParameter } from "@modules/command/main";
import Redis, { __RedisKey } from "@modules/redis";
import { getMessageType } from "@modules/message";
import { Message, MessageScope, MessageType } from "@modules/utils/message";

async function getLimited( id: string, isGuild: boolean, redis: Redis ): Promise<string[]> {
	const dbKey: string = isGuild ? __RedisKey.COMMAND_LIMIT_GUILD : __RedisKey.COMMAND_LIMIT_USER;
	return await redis.getList( dbKey );
}

export async function filterUserUsableCommand( i: InputParameter ): Promise<BasicConfig[]> {
	const userID: string = i.messageData.msg.author.id;
	const guildID: string = i.messageData.msg.src_guild_id ? i.messageData.msg.src_guild_id : i.messageData.msg.guild_id;
	const type: MessageType = getMessageType( i.messageData );
	if ( type === MessageType.Unknown ) {
		return [];
	}
	
	const auth: AuthLevel = await i.auth.get( userID, guildID );
	let commands: BasicConfig[] = i.command
		.get( auth, type === MessageType.Guild
			? MessageScope.Guild : MessageScope.Private )
		.filter( el => el.display );
	
	const userLimit: string[] = await getLimited( userID, false, i.redis );
	commands = commands.filter( el => !userLimit.includes( el.cmdKey ) );
	if ( type === MessageType.Private ) {
		return commands;
	}
	
	const groupID: string = ( <Message>i.messageData ).msg.channel_id;
	const groupLimit: string[] = await getLimited( groupID, true, i.redis );
	commands = commands.filter( el => !groupLimit.includes( el.cmdKey ) );
	return commands;
}