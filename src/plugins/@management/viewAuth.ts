import { InputParameter } from "@modules/command";
import user from "@web-console/backend/routes/user";
import { AuthLevel } from "@modules/management/auth";
import { idParser } from "@modules/utils";

/**
Author: Ethereal
CreateTime: 2022/10/7
 */

export async function main( i: InputParameter ): Promise<void> {
	
	const content = i.messageData.msg.content;
	const userId = i.messageData.msg.author.id;
	const guildId = i.messageData.msg.guild_id;
	
	if ( content.length <= 0 ) {
		const auth = await i.auth.get( userId, guildId );
		await i.sendMessage( AuthLevel[auth] );
		return;
	}
	
	const { code, target } = idParser( content );
	if ( code ) {
		const auth = await i.auth.get( target, guildId );
		await i.sendMessage( AuthLevel[auth] );
		return;
	}
}