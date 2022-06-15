import { InputParameter } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { almanacClass, renderer } from "../init";
import { scheduleJob } from "node-schedule";

export async function main(
	{ sendMessage, redis, logger }: InputParameter
): Promise<void> {
	
	//没有缓存图片，定时获取失败，重新获取并写入缓存
	await redis.setString( "silvery-star-almanac", almanacClass.get() );
	const res: RenderResult = await renderer.asBase64( "/almanac.html" );
	
	if ( res.code === "ok" ) {
		await sendMessage( res.data );
	} else {
		logger.error( res.error );
		await sendMessage( "图片渲染异常，请联系持有者进行反馈" );
	}
}