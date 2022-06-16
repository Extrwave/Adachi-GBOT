import { InputParameter } from "@modules/command";

export async function main( { sendMessage, messageData, interval, logger }: InputParameter ): Promise<void> {
	const [ atUser, time ] = messageData.msg.content.split( " " );
	const result = atUser.match( /<@!(.*)>/ );
	let targetID;
	if ( result === null ) {
		logger.error( "用户匹配出错." );
		await sendMessage( "用户匹配出错." );
	} else {
		targetID = result[1];
		await interval.set( targetID, "private", parseInt( time ) );
		await sendMessage( `用户 ${ targetID } 的操作触发间隔已改为 ${ time }ms` );
	}
	
}