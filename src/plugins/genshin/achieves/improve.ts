import { InputParameter } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { renderer } from "../init";

export async function main(
	{ sendMessage, messageData, redis, logger }: InputParameter
): Promise<void> {
	const userID: string = messageData.msg.author.id;
	const data: string | null = await redis.getString( `silvery-star.artifact-${ userID }` );
	
	if ( data === null ) {
		await sendMessage( "请先抽取一个圣遗物" );
		return;
	}
	const res: RenderResult = await renderer.asBase64(
		"/artifact.html",
		{ qq: userID, type: "rein" }
	);
	if ( res.code === "base64" ) {
		await sendMessage( { file_image: res.data } );
	} else if ( res.code === "url" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}