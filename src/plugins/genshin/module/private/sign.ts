import { randomInt } from "#genshin/utils/random";
import { signInInfoPromise, signInResultPromise } from "#genshin/utils/promise";
import { scheduleJob, Job } from "node-schedule";
import { Private, Service } from "./main";
import { SignInInfo } from "#genshin/types";
import { Order } from "@modules/command";
import bot from "ROOT";
import { getGidMemberIn } from "@modules/utils/account";

export class SignInService implements Service {
	public readonly parent: Private;
	public enable: boolean;
	private job?: Job;
	
	public FixedField = <const>"sign";
	static FixedField = <const>"sign";
	
	constructor( p: Private ) {
		const options: Record<string, any> =
			p.options[SignInService.FixedField] || {};
		
		this.parent = p;
		this.enable = options.enable === undefined
			? false : options.enable;
	}
	
	public async loadedHook(): Promise<void> {
		if ( this.enable ) {
			const delay: number = randomInt( 0, 99 );
			
			setTimeout( async () => {
				await this.sign( false );
				this.setScheduleJob();
			}, delay * 100 );
		}
	}
	
	public getOptions(): any {
		return { enable: this.enable };
	}
	
	public async initTest(): Promise<string> {
		const TOGGLE_SIGN = <Order>bot.command.getSingle( "silvery-star-private-toggle-sign" );
		return `米游社签到功能已放行，请使用「${ TOGGLE_SIGN.getHeaders()[0] }+序号」开启本功能`;
	}
	
	public async toggleEnableStatus( status?: boolean, message: boolean = true ): Promise<string> {
		this.enable = status === undefined ? !this.enable : status;
		if ( this.enable ) {
			await this.sign( true );
			this.setScheduleJob();
		} else {
			this.cancelScheduleJob();
		}
		/* 回传进行数据库更新 */
		await this.parent.refreshDBContent( SignInService.FixedField );
		return `米游社签到功能已${ this.enable ? "开启" : "关闭" }`;
	}
	
	
	public async sign( reply: boolean = true ): Promise<void> {
		const { uid, server, cookie } = this.parent.setting;
		try {
			const info = <SignInInfo>( await signInInfoPromise( uid, server, cookie ) );
			if ( info.isSign ) {
				reply ? await this.sendMessage( "您今天已在米游社签到" ) : "";
				return;
			}
			await signInResultPromise( uid, server, cookie );
			await this.sendMessage(
				`[ UID ${ uid } ]\n` +
				`今日已完成签到\n` +
				`本月累计签到 ${ info.totalSignDay + 1 } 天\n` +
				`明天同一时间见~`
			);
		} catch ( error ) {
			let msg = '米游社原神签到出错：\n';
			if ( <string>error === undefined ) {
				msg += `网络波动,请稍后重试`;
			} else if ( <string>error === '尚未登录' ) {
				msg += `cookie过期，请更新 ~ `;
			} else if ( <string>error === 'invalid request' ) {
				msg += `接口报错，请向开发者反馈`;
			} else {
				msg += <string>error;
			}
			await this.sendMessage( msg );
			bot.logger.warn( `[UID ${ uid }] ` + <string>error );
		}
	}
	
	private setScheduleJob(): void {
		this.job = scheduleJob( "0 0 8 * * *", () => {
			const sec: number = randomInt( 0, 180 );
			const time = new Date().setSeconds( sec * 10 );
			
			const job: Job = scheduleJob( time, async () => {
				await this.sign();
				job.cancel();
			} );
		} );
	}
	
	private cancelScheduleJob(): void {
		if ( this.job !== undefined ) {
			this.job.cancel();
		}
	}
	
	/* 因为sendMessage需要异步获取，无法写进构造器 */
	public async sendMessage( data: string ) {
		const userID = this.parent.setting.userID;
		//此处私发逻辑已更改
		const guildID = await getGidMemberIn( userID );
		if ( !guildID ) {
			bot.logger.error( "私信发送失败，检查成员是否退出频道 ID：" + userID );
			return;
		}
		// const channelID = await bot.redis.getHashField( `adachi.guild-used-channel`, guildID );
		// const temp = await bot.redis.getString( `adachi.msgId-temp-${ guildID }-${ channelID }` );
		// const msgId = temp === "" ? undefined : temp;
		const msgId = undefined;
		
		//缓存为空，则推送主动消息过去
		const sendMessage = await bot.message.getSendPrivateFunc( guildID, userID, msgId );
		await sendMessage( { content: data } );
		// if ( temp === "" ) {
		// 	//缓存为空，则推送主动消息过去
		// 	const sendMessage = await bot.message.getSendPrivateFunc( guildID, userID, msgId );
		// 	await sendMessage( { content: data } );
		// } else {
		// 	//存在可用消息，则发送到频道
		// 	const sendMessage = await bot.message.sendGuildMessage( channelID, msgId );
		// 	await sendMessage( { content: `<@!${ userID }>\n` + data } );
		// }
	}
}