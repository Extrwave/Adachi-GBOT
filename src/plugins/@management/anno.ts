/**
Author: Ethereal
CreateTime: 2022/6/26
 */
import { InputParameter, Order, OrderMatchResult } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";

export async function main( { messageData, redis, message }: InputParameter ) {
	const content = messageData.msg.content;
	const msgId = messageData.msg.id;
	const attachments = messageData.msg.attachments;
	
	const guildIds: string[] = await redis.getSet( `adachi.guild-used` );
	guildIds.forEach( guild => {
		redis.getHashField( `adachi.guild-used-channel`, guild ).then( channelId => {
			setTimeout( () => {
				message.sendGuildMessage( channelId, msgId )( content );
				if ( attachments ) {
					attachments.forEach( value => {
						message.sendGuildMessage( channelId, msgId )( { image: "https://" + value.url } );
					} )
				}
			}, 1500 );
		} )
	} );
}