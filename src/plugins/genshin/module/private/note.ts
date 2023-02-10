import bot from "ROOT";
import { Order } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";
import { Expedition, Note } from "#genshin/types";
import { Private, Service, UserInfo } from "./main";
import { Job, scheduleJob } from "node-schedule";
import { dailyNotePromise } from "#genshin/utils/promise";
import { sendMessage } from "#genshin/utils/private";

interface PushEvent {
	type: "resin" | "homeCoin" | "transformer" | "expedition";
	job: Job;
}

export class NoteService implements Service {
	public readonly parent: Private;
	public enable: boolean;
	
	private timePoint: number[];
	private events: PushEvent[] = [];
	private globalEvent?: Job;
	private globalData: Note | string = "[ NoteService ] - ";
	private readonly feedbackCatch: () => Promise<void>;
	
	public FixedField = <const>"note";
	static FixedField = <const>"note";
	
	constructor( p: Private ) {
		const options: Record<string, any> =
			p.options[NoteService.FixedField] || {};
		
		this.parent = p;
		this.timePoint = options.timePoint || [ 120, 155 ];
		this.enable = options.enable === undefined
			? true : options.enable;
		
		this.feedbackCatch = async () => {
			let errMsg: string = <string>this.globalData;
			if ( /验证码/.test( errMsg ) ) {
				errMsg += `\n${ await this.toggleEnableStatus( false ) }，请前往米游社手动查询后重新开启`;
			} else if ( /cookie/i.test( errMsg ) ) {
				errMsg += `\n${ await this.toggleEnableStatus( false ) }，请更新 cookie 后重新开启\n`;
			}
			await sendMessage( errMsg, this.parent.setting.userID );
		};
		
		if ( this.enable ) {
			this.scheduleJobOn();
		}
	}
	
	public getOptions(): any {
		return {
			timePoint: this.timePoint,
			enable: this.enable
		};
	}
	
	public async initTest(): Promise<string> {
		await this.getData();
		if ( typeof this.globalData === "string" ) {
			return "实时便笺功能开启失败：\n" +
				this.globalData + "\n" +
				"可能是因为米游社数据未公开或米游社内未开启实时便笺";
		} else {
			const SET_TIME = <Order>bot.command.getSingle( "silvery-star-note-set-time", AuthLevel.Master );
			const TOGGLE_NOTE = <Order>bot.command.getSingle( "silvery-star-private-toggle-note", AuthLevel.Master );
			
			const appendSetTime = SET_TIME ? `「${ SET_TIME.getHeaders()[0] }+账户序号+树脂量」调整推送条件\n` : "";
			const appendToggleNote = TOGGLE_NOTE ? `「${ TOGGLE_NOTE.getHeaders()[0] }+账户序号」关闭上述推送\n` : "";
			
			return "\n实时便笺功能已开启：\n" +
				"树脂数量达到 120 和 155 时会私聊推送\n" +
				appendSetTime +
				"宝钱、质变仪、派遣提醒功能已开启\n" +
				appendToggleNote;
		}
	}
	
	public async toggleEnableStatus( status?: boolean, message: boolean = true ): Promise<string> {
		this.enable = status === undefined ? !this.enable : status;
		if ( this.enable ) {
			this.scheduleJobOn();
		} else {
			this.scheduleJobOff();
			this.clearEvents();
		}
		/* 回传进行数据库更新 */
		await this.parent.refreshDBContent( NoteService.FixedField );
		return `实时便筏提醒功能已${ this.enable ? "开启" : "关闭" }`;
	}
	
	private scheduleJobOn(): void {
		this.refreshPushEvent().catch( this.feedbackCatch );
		this.globalEvent = scheduleJob( "0 */55 * * * *", () => {
			this.refreshPushEvent().catch( this.feedbackCatch );
		} );
	}
	
	private scheduleJobOff(): void {
		if ( this.globalEvent !== undefined ) {
			this.globalEvent.cancel();
		}
	}
	
	public async modifyTimePoint( time: number[] ): Promise<void> {
		/* 过滤超过 160 的树脂量 */
		this.timePoint = time.filter( el => el <= 160 );
		this.refreshPushEvent().catch( this.feedbackCatch );
		/* 回传进行数据库更新 */
		await this.parent.refreshDBContent( NoteService.FixedField );
	}
	
	public async toJSON(): Promise<string> {
		await this.getData();
		if ( typeof this.globalData === "string" ) {
			throw new Error( this.globalData );
		}
		return JSON.stringify( {
			...<Note>this.globalData,
			uid: this.parent.setting.uid
		} );
	}
	
	private async getData(): Promise<void> {
		try {
			const setting: UserInfo = this.parent.setting;
			this.globalData = <Note>await dailyNotePromise(
				setting.uid,
				setting.server,
				setting.cookie
			);
		} catch ( error ) {
			this.globalData = <string>error;
			if ( /Cookie已失效/.test( <string>error ) ) {
				await this.toggleEnableStatus( false, false );
				this.globalData += "\n自动提醒已停止，请更新 Cookie 后重新开启"
			}
		}
	}
	
	private clearEvents(): void {
		for ( let e of this.events ) {
			e.job.cancel();
		}
		this.events = [];
	}
	
	private async refreshPushEvent(): Promise<void> {
		const now: number = new Date().getTime();
		
		await this.getData();
		if ( typeof this.globalData === "string" ) {
			return Promise.reject( this.globalData );
		}
		
		/* 清空当前事件 */
		this.clearEvents();
		
		/* 树脂提醒 */
		for ( let t of this.timePoint ) {
			/* 当前树脂量超过设定量则不处理 */
			if ( this.globalData.currentResin >= t ) {
				continue;
			}
			
			const recovery: number = parseInt( this.globalData.resinRecoveryTime );
			const remaining: number = recovery - ( this.globalData.maxResin - t ) * 8 * 60;
			const time = new Date( now + remaining * 1000 );
			
			const job: Job = scheduleJob( time, async () => {
				await sendMessage( `[ UID${ this.parent.setting.uid } ] - 树脂量已经到达 ${ t } 了 ~`, this.parent.setting.userID );
			} );
			this.events.push( { type: "resin", job } );
		}
		
		/* 宝钱提醒 */
		if ( this.globalData.maxHomeCoin !== 0 && this.globalData.currentHomeCoin < this.globalData.maxHomeCoin ) {
			const recovery: number = parseInt( this.globalData.homeCoinRecoveryTime );
			const time = new Date( now + recovery * 1000 );
			
			const job: Job = scheduleJob( time, async () => {
				await sendMessage( `[ UID${ this.parent.setting.uid } ] - 洞天宝钱已经满了 ~`, this.parent.setting.userID );
			} );
			this.events.push( { type: "homeCoin", job } );
		}
		
		/* 参变仪提醒 */
		if ( this.globalData.transformer.obtained ) {
			const { day, hour, minute, second, reached } = this.globalData.transformer.recoveryTime;
			if ( !reached ) {
				const recovery = ( ( day * 24 + hour ) * 60 + minute ) * 60 + second;
				const time = new Date( now + recovery * 1000 );
				
				const job: Job = scheduleJob( time, async () => {
					await sendMessage( `[ UID${ this.parent.setting.uid } ] - 参量质变仪已就绪 ~`, this.parent.setting.userID );
				} );
				this.events.push( { type: "homeCoin", job } );
			}
		}
		
		/* 派遣提醒 */
		const expeditions: Expedition[] = this.globalData.expeditions
			.filter( el => el.status === "Ongoing" )
			.sort( ( x, y ) => {
				return parseInt( x.remainedTime ) - parseInt( y.remainedTime );
			} );
		if ( expeditions.length === 0 ) {
			return Promise.resolve();
		}
		
		const compressed: any = [];
		let num: number = 0;
		
		compressed.push( { num: 1, ...expeditions.shift() } );
		for ( let e of expeditions ) {
			if ( parseInt( e.remainedTime ) - parseInt( compressed[num].remainedTime ) <= 30 ) {
				compressed[num].num++;
				compressed[num].remainedTime = e.remainedTime;
			} else {
				num++;
				compressed.push( { num: 1, ...e } );
			}
		}
		
		for ( let c of compressed ) {
			const time = new Date( now + parseInt( c.remainedTime ) * 1000 );
			const job: Job = scheduleJob( time, async () => {
				await sendMessage( `[ UID${ this.parent.setting.uid } ] - 已有 ${ c.num } 个探索派遣任务完成`, this.parent.setting.userID );
			} );
			this.events.push( { type: "expedition", job } );
		}
	}
	
	
}