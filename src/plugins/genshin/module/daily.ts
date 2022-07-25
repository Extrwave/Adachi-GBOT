import bot from "ROOT"
import { getRealName, NameResult } from "../utils/name";
import { scheduleJob } from "node-schedule";
import { isCharacterInfo, isWeaponInfo, InfoResponse, CalendarData } from "../types";
import { randomInt } from "../utils/random";
import { getDailyMaterial, getInfo } from "../utils/api";
import { take } from "lodash";
import { RenderResult } from "@modules/renderer";
import { renderer } from "#genshin/init";
import { calendarPromise } from "#genshin/utils/promise";
import { getGidMemberIn } from "@modules/utils/account";

export interface DailyMaterial {
	"Mon&Thu": string[];
	"Tue&Fri": string[];
	"Wed&Sat": string[];
}

export type DailyDataMaterial = {
	[K in keyof DailyMaterial]: InfoResponse[]
}


interface DailyInfo {
	name: string;
	rarity: number;
}

export class DailySet {
	private readonly weaponSet: Record<string, DailyInfo[]>;
	private readonly characterSet: Record<string, DailyInfo[]>;
	private readonly eventData: CalendarData[];
	
	constructor( data: InfoResponse[], events: CalendarData[] ) {
		this.weaponSet = {};
		this.characterSet = {};
		this.eventData = events;
		
		for ( let d of data ) {
			const { name, rarity }: { name: string, rarity: number } = d;
			if ( isCharacterInfo( d ) ) {
				this.add( take( d.talentMaterials, 3 ), { name, rarity }, "character" );
			} else if ( isWeaponInfo( d ) ) {
				this.add( d.ascensionMaterials[0], { name, rarity }, "weapon" );
			}
		}
	}
	
	private add( keyAsArr: string[], value: any, type: string ): void {
		const name: string = `${ type }Set`;
		const keys: string[] = Object.keys( this[name] );
		const key: string = JSON.stringify( keyAsArr );
		const find: string | undefined = keys.find( el => el === key );
		
		if ( !find ) {
			this[name][key] = [ value ];
		} else {
			this[name][key].push( value );
		}
	}
	
	public async save( id: string ): Promise<void> {
		await bot.redis.setHash(
			`silvery-star.daily-temp-${ id }`, {
				weapon: JSON.stringify( this.weaponSet ),
				character: JSON.stringify( this.characterSet ),
				event: JSON.stringify( this.eventData )
			} );
	}
}

async function getRenderResult( id: string, week?: number ): Promise<RenderResult> {
	return await renderer.asUrlImage( "/daily.html", {
		id,
		week: week || "today"
	} );
}

export class DailyClass {
	private detail: DailyMaterial;
	private allData: DailyDataMaterial;
	private eventData: CalendarData[] = [];
	
	constructor() {
		this.detail = { "Mon&Thu": [], "Tue&Fri": [], "Wed&Sat": [] };
		this.allData = { "Mon&Thu": [], "Tue&Fri": [], "Wed&Sat": [] };
		getDailyMaterial().then( ( result: DailyMaterial ) => {
			this.detail = result;
		} );
		calendarPromise().then( ( result: CalendarData[] ) => {
			this.eventData = result;
		} );
		scheduleJob( "0 2 12 * * *", async () => {
			this.eventData = await calendarPromise();
		} );
		
		scheduleJob( "0 2 16 * * *", async () => {
			this.eventData = await calendarPromise();
		} );
		
		/* 每天四点重新获取材料数据 */
		scheduleJob( "0 0 4 * * *", async () => {
			this.detail = await getDailyMaterial();
		} );
		
		/* 获取订阅？已经忘记了 */
		scheduleJob( "0 0 6 * * *", async () => {
			const date: Date = new Date();
			
			/* 获取当日副本对应的角色和武器 */
			let week: number = date.getDay();
			week = date.getHours() < 4 ? week === 0 ? 6 : week - 1 : week;
			const todayInfoSet: string[] = this.getDetailSet( week );
			
			/* 获取所有角色和武器的信息 */
			await this.getAllData( week, todayInfoSet, true );
			
			/* 群发订阅信息 */
			const groupIDs: string[] = await bot.redis.getList( "silvery-star-daily-sub-group" );
			
			const groupData = new DailySet( this.getDataSet( week ), this.eventData );
			let subMessage: string = "";
			let subMessageImage = {};
			if ( week === 0 ) {
				subMessage = "周日所有材料都可以刷取哦~";
				for ( let id of groupIDs ) {
					await bot.client.messageApi.postMessage( id, { content: subMessage } );
				}
			} else {
				await groupData.save( "0" );
				const res: RenderResult = await getRenderResult( "0" );
				if ( res.code === "ok" ) {
					subMessageImage = { content: "今日材料如下", image: res.data };
					for ( let id of groupIDs ) {
						await bot.client.messageApi.postMessage( id, subMessageImage );
					}
				} else if ( res.code === "error" ) {
					bot.logger.error( res.error );
				} else {
					bot.logger.error( res.err );
					bot.logger.error( "每日素材订阅图片渲染异常，请查看日志进行检查" );
				}
			}
			
			/* 周日不对订阅信息的用户进行私发 */
			if ( week === 0 ) {
				return;
			}
			
			/* 私发订阅信息 */
			const users: string[] = await bot.redis.getKeysByPrefix( "silvery-star-daily-sub-" );
			
			for ( let key of users ) {
				const userID: string = <string>key.split( "-" ).pop();
				const data: DailySet | undefined = await this.getUserSubList( userID );
				if ( data === undefined ) {
					continue;
				}
				await data.save( userID );
				const res: RenderResult = await getRenderResult( userID );
				if ( res.code === "err" ) {
					bot.logger.error( "每日素材订阅图片渲染异常，请查看日志进行检查" );
					continue;
				} else if ( res.code === "error" ) {
					bot.logger.error( res.error );
					continue;
				}
				const randomMinute: number = randomInt( 3, 59 );
				date.setMinutes( randomMinute );
				
				scheduleJob( date, async () => {
					const guildID = await getGidMemberIn( userID );
					if ( !guildID ) {
						bot.logger.error( "私信发送失败，检查成员是否退出频道 ID：" + userID );
					} else {
						const sendMessage = await bot.message.getSendPrivateFunc( guildID, userID );
						await sendMessage( { content: "今日材料如下", image: res.data } );
					}
				} );
			}
		} );
	}
	
	private getDateStr( week: number ): string | null {
		if ( week === 1 || week === 4 ) {
			return "Mon&Thu";
		} else if ( week === 2 || week === 5 ) {
			return "Tue&Fri";
		} else if ( week === 3 || week === 6 ) {
			return "Wed&Sat";
		} else {
			return null;
		}
	}
	
	private getDetailSet( week: number ): string[] {
		const param = this.getDateStr( week );
		return param ? this.detail[param] : [];
	}
	
	private getDataSet( week: number ): InfoResponse[] {
		const param = this.getDateStr( week );
		return param ? this.allData[param] : [];
	}
	
	
	private async getAllData( week: number, set: string[], clear: boolean ): Promise<void> {
		if ( clear ) {
			this.allData = { "Mon&Thu": [], "Tue&Fri": [], "Wed&Sat": [] };
		}
		if ( week === 0 ) {
			return;
		}
		for ( let targetName of set ) {
			try {
				const data = await getInfo( targetName );
				if ( typeof data !== "string" ) {
					this.getDataSet( week ).push( data );
				}
			} catch ( e ) {
				bot.logger.error( `「${ targetName }」信息获取失败: ${ e }` );
			}
		}
	}
	
	private getWeek( initWeek?: number ): number {
		let week: number;
		if ( initWeek ) {
			week = initWeek === 7 ? 0 : initWeek;
		} else {
			const date = new Date();
			week = date.getDay();
			week = date.getHours() < 4 ? week === 0 ? 6 : week - 1 : week;
		}
		return week;
	}
	
	
	private async getUserSubList( userID: string, initWeek?: number ): Promise<DailySet | undefined> {
		const dbKey: string = `silvery-star.daily-sub-${ userID }`;
		const subList: string[] = await bot.redis.getList( dbKey );
		
		const week: number = this.getWeek( initWeek );
		if ( this.getDataSet( week ).length === 0 ) {
			const set: string[] = this.getDetailSet( week );
			await this.getAllData( week, set, false );
		}
		
		if ( subList.length === 0 ) {
			return undefined;
		}
		
		const privateSub: InfoResponse[] = [];
		for ( let item of subList ) {
			const find: InfoResponse | undefined = this.getDataSet( week ).find( el => el.name === item );
			if ( find === undefined ) {
				continue;
			}
			privateSub.push( find );
		}
		if ( privateSub.length === 0 ) {
			return undefined;
		}
		
		return new DailySet( privateSub, this.eventData );
	}
	
	public async getUserSubscription( userID: string, initWeek?: number ): Promise<{ code: string, data: string }> {
		const dbKey: string = `adachi-temp-daily-material`;
		const week: number = this.getWeek( initWeek );
		
		if ( week === 0 ) {
			return { code: "error", data: "周日所有材料都可以刷取哦~" };
		}
		
		/* 当日已经缓存过每日材料数据 */
		const daily = await bot.redis.getString( dbKey );
		if ( daily !== "" ) {
			return { code: "ok", data: daily };
		}
		
		const data: DailySet | undefined = await this.getUserSubList( userID, initWeek ? week : undefined );
		const set = data === undefined ? new DailySet( this.getDataSet( week ), this.eventData ) : data;
		
		await set.save( userID );
		//没有当日素材缓存
		const res: RenderResult = await getRenderResult( userID );
		if ( res.code === "ok" ) {
			await bot.redis.setString( dbKey, res.data, 3600 * 8 ); //应对频道高频使用场景优化
			return res;
		} else if ( res.code === "error" ) {
			bot.logger.error( res.error );
			return { code: "error", data: res.error }
		} else {
			bot.logger.error( res.err );
			return { code: "error", data: "图片渲染异常，请联系开发者进行反馈" };
		}
	}
	
	public async modifySubscription( userID: string, operation: boolean, name: string, isGroup: boolean ): Promise<string> {
		/* 添加/删除群聊订阅 */
		if ( isGroup ) {
			const dbKey: string = "silvery-star-daily-sub-group";
			const exist: boolean = await bot.redis.existListElement( dbKey, name );
			
			if ( exist === operation ) {
				return `群聊 ${ name } ${ operation ? "已订阅" : "未曾订阅" }`;
			} else if ( operation ) {
				await bot.redis.addListElement( dbKey, name );
			} else {
				await bot.redis.delListElement( dbKey, name );
			}
			
			return `群聊订阅${ operation ? "添加" : "取消" }成功`;
		}
		
		/* 添加/删除私聊订阅 */
		const result: NameResult = getRealName( name );
		
		if ( result.definite ) {
			const realName: string = <string>result.info;
			const dbKey: string = `silvery-star-daily-sub-${ userID }`;
			const exist: boolean = await bot.redis.existListElement( dbKey, realName );
			
			if ( exist === operation ) {
				return `「${ realName }」${ operation ? "已订阅" : "未曾订阅" }`;
			} else if ( operation ) {
				await bot.redis.addListElement( dbKey, realName );
			} else {
				await bot.redis.delListElement( dbKey, realName );
			}
			
			return `订阅${ operation ? "添加" : "取消" }成功`;
		} else if ( result.info === "" ) {
			return `未找到名为「${ name }」的角色或武器，若确认名称输入无误，请前往 SilveryStar/Adachi-BOT 进行反馈`;
		} else {
			return `未找到相关信息，是否要找：${ [ "", ...<string[]>result.info ].join( "\n  - " ) }`;
		}
	}
}