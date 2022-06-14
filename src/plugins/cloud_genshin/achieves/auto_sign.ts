import bot from "ROOT";
import { scheduleJob } from "node-schedule";
import { getWalletURL, getAnnouncementURL, getNotificationURL, headers } from "../util/api";
import { MessageType } from "@modules/message";
import user from "@web-console/backend/routes/user";
import { serialize } from "v8";


//定时任务
export async function autoSign() {
	bot.logger.info( "云原神自动签到已启动" )
	scheduleJob( "5 6 7 * * *", async () => {
		let keys: string[] = await bot.redis.getKeysByPrefix( 'extr-wave-yys-sign.*' )
		for ( let key of keys ) {
			let userId = key.split( '.' )[1];
			const dbKey = "extr-wave-yys-sign." + userId;
			bot.logger.info( `正在进行用户 ${ userId } 云原神签到` );
			const guild = await bot.redis.getString( `adachi.guild-id` );
			const sendMessage = await bot.message.getPrivateSendFunc( guild, userId );
			//获取用户信息填充header
			headers["x-rpc-combo_token"] = await bot.redis.getHashField( dbKey, "token" );
			headers["x-rpc-device_name"] = await bot.redis.getHashField( dbKey, "device_name" );
			headers["x-rpc-device_model"] = await bot.redis.getHashField( dbKey, "device_model" );
			headers["x-rpc-device_id"] = await bot.redis.getHashField( dbKey, "device_id" );
			
			const message = await getWalletURL( headers );
			const data = JSON.parse( message );
			if ( data.retcode === 0 && data.message === "OK" ) {
				await sendMessage(
					`今日云原神签到成功\n` +
					`畅玩卡状态：${ data.data.play_card.short_msg }\n` +
					`当前米云币数量：${ data.data.coin.coin_num }\n` +
					`当前剩余免费时间：${ data.data.free_time.free_time } / ${ data.data.free_time.free_time_limit }\n` +
					`当前剩余总分钟数：${ data.data.total_time } `
				);
			} else {
				await sendMessage( data.message );
			}
		}
	} );
}
