/**
Author: Ethereal
CreateTime: 2022/6/26
 */
import { InputParameter, Order, OrderMatchResult } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";

export async function main
( {
	  messageData, redis, message,
	  command, auth, matchResult,
	  sendMessage
  }: InputParameter ) {
	
	const dbKey = `adachi.management-announce`;
	
	const userID: string = messageData.msg.author.id;
	const content = messageData.msg.content;
	const msgId = messageData.msg.id;
	
	const header = ( <OrderMatchResult>matchResult ).header;
	const au: AuthLevel = await auth.get( userID );
	
	const SANNO = <Order>command.getSingle( "adachi-announce", au );
	const ANNO = <Order>command.getSingle( "adachi-get-announce", au );
	
	if ( SANNO.getHeaders().includes( header ) ) {
		await redis.setString( dbKey, content );
		const guildIds: string[] = await redis.getSet( `adachi.guild-used` );
		guildIds.forEach( guild => {
			redis.getHashField( `adachi.guild-used-channel`, guild ).then( channelId => {
				const sendMessage = message.sendGuildMessage( channelId, msgId );
				sendMessage( content );
			} )
		} );
	} else if ( ANNO.getHeaders().includes( header ) ) {
		const data = await redis.getString( dbKey );
		await sendMessage( `当前BOT公告：\n    ${ data }` );
	}
}