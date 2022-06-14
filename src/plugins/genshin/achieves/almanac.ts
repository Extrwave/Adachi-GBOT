import { InputParameter } from "@modules/command";
import { RenderResult } from "@modules/renderer";
import { almanacClass, renderer } from "../init";
import { scheduleJob } from "node-schedule";

export async function main(
	{ sendMessage, redis, logger }: InputParameter
): Promise<void> {
	
	//优化今日事宜缓存，每天4.01自动获取
	const dbKey: string = `extr-wave-almanac-image`;
	scheduleJob( "0 1 4 * * *", async () => {
		await redis.deleteKey( dbKey );
		//自动获取今日事宜
		await redis.setString( "silvery-star-almanac", almanacClass.get() );
		const res: RenderResult = await renderer.asCqCode( "/almanac.html" );
		
		if ( res.code === "ok" ) {
			//渲染成功，将图片缓存reids,24小时，第二天4.01清理缓存
			await redis.setString( dbKey, res.data, 24 * 3600 );
			logger.info( "今日事宜已重新获取" );
		} else {
			logger.error( res.error );
		}
	} );
	
	const image: string = await redis.getString( dbKey );
	if ( image !== "" ) {
		await sendMessage( image );//返回缓存数据
	} else {
		//没有缓存图片，定时获取失败，重新获取并写入缓存
		await redis.setString( "silvery-star-almanac", almanacClass.get() );
		const res: RenderResult = await renderer.asCqCode( "/almanac.html" );
		
		if ( res.code === "ok" ) {
			await sendMessage( res.data );
			await redis.setString( dbKey, res.data, 24 * 3600 );
		} else {
			logger.error( res.error );
			await sendMessage( "图片渲染异常，请联系持有者进行反馈" );
		}
	}
}