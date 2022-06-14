import { InputParameter } from "@modules/command";
import { slipClass } from "../init";

export async function main( { sendMessage, messageData }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	
	const result: string = await slipClass.get( userID );
	await sendMessage( result );
}