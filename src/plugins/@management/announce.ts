/**
Author: Ethereal
CreateTime: 2022/6/26
 */
import { InputParameter } from "@modules/command";

export async function main( { messageData, redis, message }: InputParameter ) {
	const content = messageData.msg.content;
	const guildIds: string[] = await redis.getSet( `adachi.guild-used` );
	guildIds.forEach( guild => {
		redis.getHashField( `adachi.guild-used-channel`, guild ).then( channelId => {
			const sendMessage = message.sendGuildMessage( channelId );
			sendMessage( content );
		} )
	} );
}