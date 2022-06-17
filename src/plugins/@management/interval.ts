import { InputParameter } from "@modules/command";
import idParser from "#@help/utils/id-parser";

export async function main( { sendMessage, messageData, interval, logger }: InputParameter ): Promise<void> {
	const [ atUser, time ] = messageData.msg.content.split( " " );
	const { code, targetID } = idParser( atUser );
	if ( code === "error" ) {
		logger.error( targetID );
		await sendMessage( targetID );
	} else {
		await interval.set( targetID, "private", parseInt( time ) );
		await sendMessage( `用户 ${ targetID } 的操作触发间隔已改为 ${ time }ms` );
	}
	
}