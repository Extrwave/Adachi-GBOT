/**
Author: Ethereal
CreateTime: 2022/6/26
 */
import { InputParameter, Order, OrderMatchResult } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";
import { __RedisKey } from "@modules/redis";

export async function main( { messageData, redis, message }: InputParameter ) {
	const userId = messageData.msg.author.id;
	let content = messageData.msg.content;
	const msgId = messageData.msg.id;
	const attachments = messageData.msg.attachments;
	
	content = "来自开发者留言：\n  " + content;
	
	const guildIds: string[] = await redis.getSet( __RedisKey.GUILD_USED );
	guildIds.forEach( guild => {
		redis.getHashField( __RedisKey.GUILD_USED_CHANNEL, guild ).then( channelId => {
			setTimeout( async () => {
				await ( await message.getSendGuildFunc( userId, guild, channelId, msgId ) )( content );
				if ( attachments ) {
					for ( const value of attachments ) {
						await ( await message.getSendGuildFunc( userId, guild, channelId, msgId ) )( { image: "https://" + value.url } );
					}
				}
			}, 1500 );
		} )
	} );
}