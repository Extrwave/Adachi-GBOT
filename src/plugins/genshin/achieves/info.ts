import { InputParameter } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { NameResult, getRealName } from "../utils/name";
import { renderer, typeData } from "#genshin/init";

export async function main(
	{ sendMessage, messageData, logger, redis }: InputParameter
): Promise<void> {
	const rawMessage: string = messageData.msg.content;
	
	// 是否为技能详情页
	const isSkillPage = rawMessage.includes( "-skill" );
	
	const name: string = rawMessage.replace( /-skill/, "" ).trim();
	
	const result: NameResult = getRealName( name );
	
	if ( result.definite ) {
		const info = <string>result.info;
		const checked = ( list: any ) => list.includes( info );
		
		if ( !checked( Object.keys( typeData.character ) ) && isSkillPage ) {
			await sendMessage( "仅角色支持查看技能详情" );
		} else {
			/* 八小时内重复获取 */
			// const dbKey: string = `adachi-temp-info-${ result.info }-${ isSkillPage }`;
			// const infoTemp = await redis.getString( dbKey );
			// if ( infoTemp !== "" ) {
			// 	await sendMessage( { image: infoTemp } );
			// 	return;
			// }
			
			const route: string = checked( typeData.artifact.suitNames ) ? "/info-artifact.html" : "/info.html";
			await sendMessage( "获取成功，正在生成图片..." );
			const res: RenderResult = await renderer.asLocalImage(
				route,
				{ name: result.info, skill: isSkillPage }
			);
			if ( res.code === "ok" ) {
				await sendMessage( { file_image: res.data } );
				// await redis.setString( dbKey, res.data, 3600 * 8 );
			} else if ( res.code === "other" ) {
				await sendMessage( { image: res.data } );
			} else {
				await sendMessage( res.data );
			}
		}
	} else if ( result.info === "" ) {
		await sendMessage( `暂无关于「${ name }」的信息，若确认名称输入无误，请联系频道主进行反馈` );
	} else {
		await sendMessage( `未找到相关信息，是否要找：${ [ "", ...<string[]>result.info ].join( "\n  - " ) }` );
	}
}