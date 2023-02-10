import { InputParameter } from "@modules/command";
import { analysisHandler } from "#genshin_draw_analysis/achieves/draw_analysis";
import { getPrivateAccount } from "@plugins/genshin/utils/private";
import { DB_KEY } from "#genshin_draw_analysis/util/types";

export async function main(
	{ sendMessage, messageData, redis }: InputParameter
): Promise<void> {
	const userID = messageData.msg.author.id, raw_message = messageData.msg.content;
	const reg = new RegExp( /(?<sn>\d+)?(\s)*(?<style>\d+)?/ );
	const res: RegExpExecArray | null = reg.exec( raw_message );
	const style: string = res?.groups?.style || "";
	const sn: string = res?.groups?.sn || "1";
	
	const account = await getPrivateAccount( userID, sn );
	if ( typeof account === 'string' ) {
		await sendMessage( account );
		return;
	}
	let uid = account.setting.uid;
	
	const history = await redis.getKeysByPrefix( `${ DB_KEY.ANALYSIS_DATA }-*-${ uid }` );
	
	if ( history.length <= 0 ) {
		await sendMessage( "暂无历史记录" );
		return;
	}
	
	await analysisHandler( uid, style, sendMessage );
}