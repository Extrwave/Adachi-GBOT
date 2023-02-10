import bot from "ROOT";
import { Order } from "@modules/command";
import { Private, Service } from "./main";
import { Award, SignInInfo } from "#genshin/types";
import { scheduleJob, Job } from "node-schedule";
import { sendMessage } from "#genshin/utils/private";
import { randomInt } from "#genshin/utils/random";
import { signInInfoPromise, signInResultPromise, SinInAwardPromise } from "#genshin/utils/promise";
import { EmbedMsg } from "@modules/utils/embed";

scheduleJob( "0 5 0 * * *", async () => {
	await SinInAwardPromise();
} );

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
				this.setScheduleJob();
			}, delay * 100 );
			/* 启动时候签到一小时内进行 */
			const signDelay: number = randomInt( 0, 3600 );
			setTimeout( async () => {
				await this.sign();
			}, signDelay );
		}
	}
	
	public getOptions(): any {
		return { enable: this.enable };
	}
	
	public async initTest(): Promise<string> {
		const TOGGLE_SIGN = <Order>bot.command.getSingle( "silvery-star-private-toggle-sign" );
		const content = await this.toggleEnableStatus( false );
		return `${ content }\n「${ TOGGLE_SIGN.getHeaders()[0] }+序号」开关签到功能`;
	}
	
	public async toggleEnableStatus( status?: boolean ): Promise<string> {
		this.enable = status === undefined ? !this.enable : status;
		if ( this.enable ) {
			await this.sign();
			this.setScheduleJob();
		} else {
			this.cancelScheduleJob();
		}
		/* 回传进行数据库更新 */
		await this.parent.refreshDBContent( SignInService.FixedField );
		return `米游社签到功能已${ this.enable ? "开启" : "关闭" }`;
	}
	
	
	public async sign( reply: boolean = false ): Promise<void> {
		const { uid, server, cookie } = this.parent.setting;
		let resultMsg: EmbedMsg | string;
		try {
			const info = <SignInInfo>( await signInInfoPromise( uid, server, cookie ) );
			let awards;
			//不能让奖励获取问题，影响到签到执行
			awards = await bot.redis.getString( `adachi.genshin-sign-in-award` );
			awards = awards ? JSON.parse( awards ) : await SinInAwardPromise();
			if ( !info.isSign ) {
				await signInResultPromise( uid, server, cookie );
				const award: Award = awards[info.totalSignDay];
				resultMsg = new EmbedMsg(
					`今日米游社签到成功`,
					"",
					`今日米游社签到成功`,
					award.icon,
					`米游社账号：${ uid }`,
					`今日的奖励：${ award.name } × ${ award.cnt }`,
					`本月已签到：${ info.totalSignDay }天`,
					`本月已漏签：${ info.signCntMissed }天`,
					`期待明天与你再次相见` );
			} else {
				const award: Award = awards[info.totalSignDay - 1];
				resultMsg = new EmbedMsg(
					`今日米游社已签到`,
					"",
					`今日米游社已签到`,
					award.icon,
					`米游社账号：${ uid }`,
					`今日的奖励：${ award.name } × ${ award.cnt }`,
					`本月已签到：${ info.totalSignDay }天`,
					`本月已漏签：${ info.signCntMissed }天`,
					`期待明天与你再次相见` );
			}
			reply ? await sendMessage( { embed: resultMsg }, this.parent.setting.userID ) : "";
		} catch ( error ) {
			if ( /Cookie已失效/.test( <string>error ) ) {
				await this.toggleEnableStatus( false );
				await sendMessage( error + "\n自动签到已关闭，请更新 Cookie 后重新开启", this.parent.setting.userID );
			}
			bot.logger.error( error );
		}
	}
	
	private setScheduleJob(): void {
		this.job = scheduleJob( "0 30 7 * * *", () => {
			/* 每日签到一小时内内随机进行 */
			const sec: number = randomInt( 0, 360 );
			const time = new Date().setSeconds( sec * 10 );
			
			const job: Job = scheduleJob( time, async () => {
				await this.sign( true );
				job.cancel();
			} );
		} );
	}
	
	private cancelScheduleJob(): void {
		if ( this.job !== undefined ) {
			this.job.cancel();
		}
	}
}