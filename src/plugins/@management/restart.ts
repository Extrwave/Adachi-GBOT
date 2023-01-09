import { InputParameter } from "@modules/command";
import { execHandle } from "@modules/utils";
import { __RedisKey } from "@modules/redis";


export async function main( { sendMessage, logger, messageData, redis }: InputParameter ): Promise<void> {
	const guildId = messageData.msg.guild_id;
	const srcGuildId = messageData.msg.src_guild_id;
	const userId = messageData.msg.author.id;
	const channelId = messageData.msg.channel_id;
	const msgId = messageData.msg.id;
	
	await redis.setHashField( __RedisKey.RESTART_PARAM, "userId", userId );
	await redis.setHashField( __RedisKey.RESTART_PARAM, "guildId", guildId );
	await redis.setHashField( __RedisKey.RESTART_PARAM, "srcGuildId", srcGuildId )
	await redis.setHashField( __RedisKey.RESTART_PARAM, "channelId", channelId );
	await redis.setHashField( __RedisKey.RESTART_PARAM, "msgId", msgId );
	await redis.setTimeout( __RedisKey.RESTART_PARAM, 120 );
	await sendMessage( "开始重启 BOT，请稍后" );
	try {
		await execHandle( "pm2 restart adachi-gbot" );
	} catch ( error ) {
		logger.error( error );
		await sendMessage( `重启 BOT 出错: ${ ( <Error>error ).message }` );
	}
}