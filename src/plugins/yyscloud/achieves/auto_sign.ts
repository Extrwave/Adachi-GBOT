import bot from "ROOT";
import { scheduleJob } from "node-schedule";
import { getWalletURL, getAnnouncementURL, getNotificationURL, HEADERS } from "../util/api";
import { getHeaders } from "#yyscloud/util/header";
import { getMemberInfo } from "@modules/utils/account";
import { InputParameter } from "@modules/command";
import * as Msg from "@modules/message";


//定时任务
export async function autoSign() {
	bot.logger.info( "云原神自动签到服务已启动" );
	scheduleJob( "5 6 7 * * *", async () => {
		await allSign( true );
	} );
}

async function allSign( auto: boolean, sendMessage?: Msg.SendFunc ) {
	let keys: string[] = await bot.redis.getKeysByPrefix( 'extr-wave-yys-sign-*' );
	const result: string[] = [];
	
	for ( let key of keys ) {
		let userId = key.split( '-' )[4];
		//此处私发逻辑已更改
		const account = await getMemberInfo( userId );
		if ( !account ) {
			bot.logger.error( "获取成员信息失败，检查成员是否退出频道 ID：" + userId );
			result.push( "检查是否退出频道 ID：" + userId );
			continue;
		}
		
		bot.logger.info( `正在进行用户 [ ${ account.account.nick } ] 云原神签到` );
		//获取用户信息填充header
		const headers: HEADERS = await getHeaders( userId );
		const message = await getWalletURL( headers );
		const data = JSON.parse( message );
		
		if ( auto ) {
			const sendMessage = await bot.message.getPrivateSendFunc( account.guildID, userId );
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
		} else {
			result.push( `已为用户 [ ${ account.account.nick } ] 云原神签到成功` );
		}
	}
	if ( result.length > 0 && sendMessage ) {
		await sendMessage( [ ...result ].join( "\n" ) );
	}
}

export async function main( { sendMessage }: InputParameter ) {
	await allSign( false, sendMessage );
}
