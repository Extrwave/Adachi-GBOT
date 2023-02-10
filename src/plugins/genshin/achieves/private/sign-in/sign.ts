import { InputParameter } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { privateClass } from "#genshin/init";
import { SignInService } from "#genshin/module/private/sign";

/**
Author: Ethereal
CreateTime: 2022/8/7
 */
export async function main( { sendMessage, messageData }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const sn: number = messageData.msg.content ? parseInt( messageData.msg.content ) : 1;
	const single: Private | string = await privateClass.getSinglePrivate( userID, sn );
	
	if ( typeof single === "string" ) {
		await sendMessage( single );
	} else {
		await ( <SignInService>single.services[SignInService.FixedField] ).sign( true );
	}
}