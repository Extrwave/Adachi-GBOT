import bot from "ROOT";
import { Order } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";
import { Note, Expedition } from "#genshin/types";
import { Private, Service, UserInfo } from "./main";
import { scheduleJob, Job } from "node-schedule";
import { dailyNotePromise } from "#genshin/utils/promise";
import { getGidMemberIn } from "@modules/utils/account";

interface PushEvent {
	type: "resin" | "expedition";
	job: Job;
}

export class NoteService implements Service {
	public readonly parent: Private;
	public enable: boolean;
	
	private timePoint: number[];
	private events: PushEvent[] = [];
	private globalEvent?: Job;
	private globalData: Note | string = "";
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
			await this.sendMessage( <string>this.globalData );
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
			const auth: AuthLevel = await bot.auth.get( this.parent.setting.userID );
			const SET_TIME = <Order>bot.command.getSingle( "silvery-star-note-set-time", auth );
			const TOGGLE_NOTE = <Order>bot.command.getSingle( "silvery-star-private-toggle-note", auth );
			
			return "实时便笺功能已开启：\n" +
				"树脂数量达到 120 和 155 时和探索结束会进行私聊推送\n" +
				`也可以通过「${ SET_TIME.getHeaders()[0] }+序号+树脂量」来设置\n` +
				`如果你希望关闭定时提醒功能，可以使用「${ TOGGLE_NOTE.getHeaders()[0] }+序号」`;
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
		return `树脂及冒险探索定时提醒功能已${ this.enable ? "开启" : "关闭" }`;
	}
	
	private scheduleJobOn(): void {
		this.refreshPushEvent()
			.catch( this.feedbackCatch );
		this.globalEvent = scheduleJob( "0 0 */1 * * *", () => {
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
			if ( /cookie/.test( this.globalData ) ) {
				this.globalData += "，自动提醒已停止，请更新 cookie 后重新开启";
				await this.toggleEnableStatus( false, false );
			}
			return Promise.reject();
		}
		
		/* 清空当前事件 */
		this.clearEvents();
		
		for ( let t of this.timePoint ) {
			/* 当前树脂量超过设定量则不处理 */
			if ( this.globalData.currentResin >= t ) {
				continue;
			}
			
			const recovery: number = parseInt( this.globalData.resinRecoveryTime );
			const remaining: number = recovery - ( 160 - t ) * 8 * 60;
			const time = new Date( now + remaining * 1000 );
			
			const job: Job = scheduleJob( time, async () => {
				await this.sendMessage( `[UID${ this.parent.setting.uid }] - 树脂量已经到达 ${ t } 了哦~` );
			} );
			this.events.push( { type: "resin", job } );
		}
		
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
				await this.sendMessage( `[UID${ this.parent.setting.uid }] - 已有 ${ c.num } 个探索派遣任务完成` );
			} );
			this.events.push( { type: "expedition", job } );
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
		const channelID = await bot.redis.getHashField( `adachi.guild-used-channel`, guildID );
		const temp = await bot.redis.getString( `adachi.msgId-temp-${ guildID }-${ channelID }` );
		const msgId = temp === "" ? "1000" : temp;
		if ( temp === "" ) {
			//缓存为空，则推送主动消息过去, 1000利用频道自己留的后门，不稳定，随时修复
			const sendMessage = await bot.message.getPrivateSendFunc( guildID, userID, msgId );
			await sendMessage( { content: data } );
		} else {
			//存在可用消息，则发送到频道
			const sendMessage = await bot.message.sendGuildMessage( channelID, msgId );
			await sendMessage( { content: `<@!${ userID }>\n${ data }` } );
		}
	}
}