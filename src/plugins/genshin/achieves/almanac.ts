import { InputParameter } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { almanacClass, renderer } from "../init";

export async function main(
	{ sendMessage, redis, logger }: InputParameter
): Promise<void> {
	await redis.setString( "silvery-star-almanac", almanacClass.get() );
	const res: RenderResult = await renderer.asBase64( "/almanac.html" );
	
	if ( res.code === "base64" ) {
		await sendMessage( { file_image: res.data } );
	} else if ( res.code === "url" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}