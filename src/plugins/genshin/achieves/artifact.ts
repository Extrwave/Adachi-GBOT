import { InputParameter } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { artClass, renderer } from "../init";

export async function main(
	{ sendMessage, messageData, redis, logger }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const domain: number = messageData.msg.content.length
		? parseInt( messageData.msg.content ) - 1 : -1;
	const reason: string = await artClass.get( userID, domain, redis );
	
	if ( reason !== "" ) {
		await sendMessage( reason );
		return;
	}
	const res: RenderResult = await renderer.asUrlImage(
		"/artifact.html",
		{ qq: userID, type: "init" }
	);
	if ( res.code === "ok" ) {
		await sendMessage( { image: res.data } );
	} else {
		logger.error( res.error );
		await sendMessage( "图片渲染异常，请联系持有者进行反馈" );
	}
}