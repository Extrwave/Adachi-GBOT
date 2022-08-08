import { InputParameter, SwitchMatchResult } from "@modules/command";
import idParser from "#@help/utils/id-parser";

export async function main
( {
	  sendMessage, matchResult,
	  redis, logger
  }: InputParameter ): Promise<void> {
	const match = <SwitchMatchResult>matchResult;
	const states: string = match.isOn() ? "开启" : "关闭";
	
	const [ id, key ] = match.match;
	const { code, targetID } = idParser( id );
	if ( code === "error" ) {
		logger.error( targetID );
		await sendMessage( targetID );
	} else {
		let dbKey: string, reply: string;
		dbKey = `adachi.user-command-limit-${ targetID }`;
		reply = `用户 [ <@!${ targetID }> ] 的 ${ key } 权限已${ states }`;
		if ( match.isOn() ) {
			await redis.delListElement( dbKey, key );
		} else {
			await redis.addListElement( dbKey, key );
		}
		await sendMessage( reply );
	}
}