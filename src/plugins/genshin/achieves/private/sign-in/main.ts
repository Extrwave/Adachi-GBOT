import { InputParameter } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { SignInService } from "#genshin/module/private/sign";
import { privateClass } from "#genshin/init";

export async function main( { messageData, sendMessage }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const serID: number = parseInt( messageData.msg.content );
	const single: Private | string = await privateClass.getSinglePrivate( userID, serID );
	
	if ( typeof single === "string" ) {
		await sendMessage( single );
	} else {
		await ( <SignInService>single.services[SignInService.FixedField] ).toggleEnableStatus();
	}
}