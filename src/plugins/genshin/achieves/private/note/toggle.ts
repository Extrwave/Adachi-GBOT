import { InputParameter } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { NoteService } from "#genshin/module/private/note";
import { privateClass } from "#genshin/init";

export async function main( { messageData, sendMessage }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const sn = messageData.msg.content ? parseInt( messageData.msg.content ) : 1;
	const single: Private | string = await privateClass.getSinglePrivate( userID, sn );
	
	if ( typeof single === "string" ) {
		await sendMessage( single );
	} else {
		await sendMessage( await ( <NoteService>single.services[NoteService.FixedField] ).toggleEnableStatus() );
	}
}