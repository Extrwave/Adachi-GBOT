import bot from "ROOT";
import { scheduleJob } from "node-schedule";
import { getWalletURL, HEADERS } from "../util/api";
import { getHeaders } from "#yyscloud/util/header";
import { getMemberInfo } from "@modules/utils/account";
import { InputParameter } from "@modules/command";
import * as Msg from "@modules/message";
import { EmbedMsg } from "@modules/utils/embed";


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
		let yysId = key.split( '-' )[5];
		bot.logger.info( `正在进行 [ ${ yysId } ] 云原神签到` );
		try {
			//获取用户信息填充header
			const headers: HEADERS = await getHeaders( userId, yysId );
			const message = await getWalletURL( headers );
			const data = JSON.parse( message );
			/* 获取不到用户信息跳过通知 */
			const account = await getMemberInfo( userId );
			const sendPostMessage = await bot.message.getPostPrivateFunc( userId );
			
			if ( !account || !sendPostMessage ) {
				bot.logger.error( `UserId ${ userId } 获取成员信息失败` );
				result.push( `[MysID ${ yysId } ] - 用户 ${ userId } 可能已退出所有使用频道` );
				continue;
			}
			
			if ( data.retcode === 0 && data.message === "OK" ) {
				const embedMsg = new EmbedMsg(
					`今日云原神签到成功`,
					"",
					`今日云原神签到成功`,
					account.account.user.avatar,
					`云原神账号：${ yysId }`,
					`畅玩卡状态：${ data.data.play_card.short_msg }`,
					`当前米云币数量：${ data.data.coin.coin_num }`,
					`今日获得分钟数：15`,
					`当前剩余免费时间：${ data.data.free_time.free_time } / ${ data.data.free_time.free_time_limit }`,
					`当前剩余总分钟数：${ data.data.total_time } ` );
				auto ? await sendPostMessage( { embed: embedMsg } ) :
					result.push( `[MysID ${ yysId } ] - 签到成功` );
			} else {/* 签到失败 */
				auto ? await sendPostMessage( data.message ) :
					result.push( `[MysID ${ yysId } ] - ${ data.message }` );
			}
		} catch ( error ) {
			result.push( `[MysID ${ yysId } ] - ${ <string>error }` );
			bot.logger.error( `[MysID ${ yysId } } ] - ${ <string>error }` );
		}
	}
	
	/* 处理allyys指令，用户数太多的话分条发送 */
	if ( result.length > 0 && sendMessage ) {
		let index = 0;
		while ( index < result.length ) {
			const temp = result.slice( index, index + 30 );
			await sendMessage( [ ...temp ].join( "\n" ) );
			index += 30;
		}
	}
}

export async function main( { sendMessage }: InputParameter ) {
	await allSign( false, sendMessage );
}
