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
		//此处私发逻辑已更改
		const account = await getMemberInfo( userId );
		if ( !account ) {
			bot.logger.error( "获取成员信息失败，检查成员是否退出频道 ID：" + userId );
			result.push( "用户已退出频道 ID：" + userId );
			continue;
		}
		bot.logger.info( `正在进行 [ ${ yysId } ] 云原神签到` );
		try {
			//获取用户信息填充header
			const headers: HEADERS = await getHeaders( userId, yysId );
			const message = await getWalletURL( headers );
			const data = JSON.parse( message );
			const sendPostMessage = await bot.message.getSendPrivateFunc( account.guildID, userId );
			if ( data.retcode === 0 && data.message === "OK" ) {
				if ( auto ) {
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
						`当前剩余总分钟数：${ data.data.total_time } `
					)
					await sendPostMessage( { embed: embedMsg } );
				}
				result.push( `[ ${ account.account.nick } ] - [ ${ yysId } ] 签到成功` );
			} //签到失败
			else {
				if ( auto ) {
					await sendPostMessage( data.message );
				}
				result.push( `[ ${ account.account.nick } ] - [ ${ yysId } ]: 账号已过期或者防沉迷限制` );
				bot.logger.error( `[ ${ account.account.nick } ] - [ ${ yysId } } ]: 账号已过期或者防沉迷限制` );
			}
		} catch ( error ) {
			result.push( ( `[ ${ account.account.nick } ] - [ ${ yysId } ]:` + JSON.stringify( error ) ) );
			bot.logger.error( error );
		}
	}
	//用户数太多的话分条发送
	if ( result.length > 0 && sendMessage ) {
		let index = 0;
		while ( index < result.length ) {
			const temp = result.slice( index, index + 40 );
			await sendMessage( [ ...temp ].join( "\n" ) );
			index += 40;
		}
	}
}

export async function main( { sendMessage }: InputParameter ) {
	await allSign( false, sendMessage );
}
