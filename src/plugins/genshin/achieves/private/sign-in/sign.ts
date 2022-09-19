import { InputParameter } from "@modules/command";
import { SendMsgType } from "@modules/utils/message";
import { Private } from "#genshin/module/private/main";
import { privateClass } from "#genshin/init";
import { SignInService } from "#genshin/module/private/sign";

/**
Author: Ethereal
CreateTime: 2022/8/7
 */
export async function main( { sendMessage, messageData }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const serID: number = parseInt( messageData.msg.content );
	const single: Private | string = await privateClass.getSinglePrivate( userID, serID );
	
	if ( typeof single === "string" ) {
		await sendMessage( single );
	} else {
		await ( <SignInService>single.services[SignInService.FixedField] ).sign( true );
	}
}