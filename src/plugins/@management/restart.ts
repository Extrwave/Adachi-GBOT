import { InputParameter } from "@modules/command";
import { execHandle } from "@modules/utils";


export async function main( { sendMessage, logger, messageData, redis }: InputParameter ): Promise<void> {
	const guildId = messageData.msg.guild_id;
	const isPrivate = !!messageData.msg.src_guild_id;
	const channelId = messageData.msg.channel_id;
	const msgId = messageData.msg.id;
	
	await redis.setHashField( "adachi.restart-param", "private", isPrivate );
	await redis.setHashField( "adachi.restart-param", "guild", guildId );
	await redis.setHashField( "adachi.restart-param", "channel", channelId );
	await redis.setHashField( "adachi.restart-param", "msgId", msgId );
	await redis.setTimeout( "adachi.restart-param", 120 );
	await sendMessage( "开始重启 BOT，请稍后" );
	try {
		await execHandle( "pm2 restart adachi-gbot" );
	} catch ( error ) {
		logger.error( error );
		await sendMessage( `重启 BOT 出错: ${ ( <Error>error ).message }` );
	}
}