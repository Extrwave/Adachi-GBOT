/**
Author: Extrwave
CreateTime: 2022/12/21
 */

import { InputParameter } from "@modules/command";
import { getPrivateAccount } from "@plugins/genshin/utils/private";
import { DB_KEY } from "#genshin_draw_analysis/util/types";

export async function main( { sendMessage, messageData, redis }: InputParameter ): Promise<void> {
	const userID = messageData.msg.author.id;
	const sn = messageData.msg.content;
	const account = await getPrivateAccount( userID, sn );
	if ( typeof account === 'string' ) {
		await sendMessage( account );
		return;
	}
	let uid = account.setting.uid;
	const keys: string[] = [
		`${ DB_KEY.ANALYSIS_URL }-${ uid }`,
		`${ DB_KEY.ANALYSIS_DATA }-100-${ uid }`,
		`${ DB_KEY.ANALYSIS_DATA }-200-${ uid }`,
		`${ DB_KEY.ANALYSIS_DATA }-301-${ uid }`,
		`${ DB_KEY.ANALYSIS_DATA }-302-${ uid }`,
		`${ DB_KEY.ANALYSIS_DATA }-400-${ uid }`
	]
	await redis.deleteKey( ...keys );
	await sendMessage( `[ UID${ uid } ] 的抽卡统计数据已清除。` );
}