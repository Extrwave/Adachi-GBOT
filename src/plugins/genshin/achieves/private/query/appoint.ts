import { Private } from "#genshin/module/private/main";
import { InputParameter } from "@modules/command";
import { MysQueryService } from "#genshin/module/private/mys";
import { NameResult, getRealName } from "#genshin/utils/name";
import { characterID, privateClass } from "#genshin/init";

export async function main( { sendMessage, messageData }: InputParameter ): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const data: string = messageData.msg.content;
	
	const [ id, name ] = data.split( " " );
	const single: Private | string = await privateClass.getSinglePrivate( userID, parseInt( id ) );
	
	if ( typeof single === "string" ) {
		await sendMessage( single );
	} else {
		const result: NameResult = getRealName( name );
		if ( result.definite ) {
			const realName: string = <string>result.info;
			await ( <MysQueryService>single.services[MysQueryService.FixedField] ).modifyAppointChar(
				characterID.map[realName].toString()
			);
			await sendMessage( "卡片头像指定成功" );
		} else {
			await sendMessage( "卡片头像指定失败，请尝试使用完整的角色名" );
		}
	}
}