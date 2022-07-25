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
	const attachments = messageData.msg.attachments;
	
	const header = ( <OrderMatchResult>matchResult ).header;
	const au: AuthLevel = await auth.get( userID );
	
	const ANNO = <Order>command.getSingle( "adachi-get-announce", au );
	const SANNO = <Order>command.getSingle( "adachi-announce", au ); //权限高，优先判断存在undefined情况
	
	if ( ANNO.getHeaders().includes( header ) ) {
		const data = await redis.getString( dbKey );
		await sendMessage( `当前BOT公告：\n    ${ data }` );
	} else if ( SANNO.getHeaders().includes( header ) ) {
		await redis.setString( dbKey, content );
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
}