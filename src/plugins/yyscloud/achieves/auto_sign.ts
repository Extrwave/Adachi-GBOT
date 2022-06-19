import bot from "ROOT";
import { scheduleJob } from "node-schedule";
import { getWalletURL, getAnnouncementURL, getNotificationURL, HEADERS } from "../util/api";
import { getHeaders } from "#yyscloud/util/header";
import { getGidMemberIn } from "@modules/utils/account";


//定时任务
export async function autoSign() {
	bot.logger.info( "云原神自动签到已启动" )
	scheduleJob( "5 6 7 * * *", async () => {
		let keys: string[] = await bot.redis.getKeysByPrefix( 'extr-wave-yys-sign.*' )
		for ( let key of keys ) {
			let userId = key.split( '.' )[1];
			const dbKey = "extr-wave-yys-sign." + userId;
			bot.logger.info( `正在进行用户 ${ userId } 云原神签到` );
			//此处私发逻辑已更改
			const guild = await getGidMemberIn( userId );
			if ( !guild ) {
				bot.logger.error( "获取成员信息失败，检查成员是否退出频道 ID：" + userId );
				return;
			}
			const sendMessage = await bot.message.getPrivateSendFunc( guild, userId );
			//获取用户信息填充header
			const headers: HEADERS = await getHeaders( userId );
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
