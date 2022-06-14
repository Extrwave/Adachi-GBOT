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
			const route: string = checked( typeData.artifact.suitNames ) ? "/info-artifact.html" : "/info.html";
			const res: RenderResult = await renderer.asCqCode(
				route,
				{ name: result.info, skill: isSkillPage }
			);
			if ( res.code === "ok" ) {
				await sendMessage( { image: res.data } );
			} else {
				logger.error( res.error );
				await sendMessage( "图片渲染异常，请联系持有者进行反馈" );
			}
		}
	} else if ( result.info === "" ) {
		await sendMessage( `暂无关于「${ name }」的信息，若确认名称输入无误，请联系频道主进行反馈` );
	} else {
		await sendMessage( `未找到相关信息，是否要找：${ [ "", ...<string[]>result.info ].join( "\n  - " ) }` );
	}
}