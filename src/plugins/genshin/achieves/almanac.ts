import { InputParameter } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { almanacClass, renderer } from "../init";

export async function main(
	{ sendMessage, redis, logger }: InputParameter
): Promise<void> {
	
	const dbKey = `adachi-temp-almanac`;
	const almanacTemp = await redis.getString( dbKey );
	if ( almanacTemp !== "" ) {
		await sendMessage( { image: almanacTemp } );
		return;
	}
	
	//没有缓存图片，定时获取失败，重新获取并写入缓存
	await redis.setString( "silvery-star-almanac", almanacClass.get() );
	const res: RenderResult = await renderer.asUrlImage( "/almanac.html" );
	
	if ( res.code === "ok" ) {
		await sendMessage( { image: res.data } );
		await redis.setString( dbKey, res.data, 3600 * 8 );
	} else if ( res.code === "error" ) {
		await sendMessage( res.error )
	} else {
		logger.error( res.err );
		await sendMessage( "图片渲染异常，请联系持有者进行反馈" );
	}
}