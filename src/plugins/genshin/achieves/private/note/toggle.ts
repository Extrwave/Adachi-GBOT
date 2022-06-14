import { InputParameter } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { NoteService } from "#genshin/module/private/note";
import { privateClass } from "#genshin/init";

export async function main( { messageData, sendMessage }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const serID: number = parseInt( messageData.msg.content );
	const single: Private | string = await privateClass.getSinglePrivate( userID, serID );
	
	if ( typeof single === "string" ) {
		await sendMessage( single );
	} else {
		await ( <NoteService>single.services[NoteService.FixedField] ).toggleEnableStatus();
	}
}