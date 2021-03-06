import bot from "ROOT"
import { getRealName, NameResult } from "../utils/name";
import { scheduleJob } from "node-schedule";
import { CalendarData, InfoResponse, isCharacterInfo, isWeaponInfo } from "../types";
import { randomInt } from "../utils/random";
import { getDailyMaterial, getInfo } from "../utils/api";
import { take } from "lodash";
import { RenderResult } from "@modules/renderer";
import { renderer } from "#genshin/init";
import { calendarPromise } from "#genshin/utils/promise";
import { getGidMemberIn } from "@modules/utils/account";
import { Order } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";

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

async function getRenderResult( id: string, subState: boolean, week?: number ): Promise<RenderResult> {
	return await renderer.asUrlImage( "/daily.html", {
		id,
		type: subState ? "sub" : "all",
		week: week ?? "today"
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
		scheduleJob( "0 2 12,16 * * *", async () => {
			this.eventData = await calendarPromise();
		} );
		
		scheduleJob( "0 2 16 * * *", async () => {
			this.eventData = await calendarPromise();
		} );
		
		scheduleJob( "0 0 4 * * *", async () => {
			this.detail = await getDailyMaterial();
		} );
		
		scheduleJob( "0 0 6 * * *", async () => {
			const date: Date = new Date();
			
			/* ?????????????????????????????????????????? */
			let week: number = date.getDay();
			week = date.getHours() < 4 ? week === 0 ? 6 : week - 1 : week;
			const todayInfoSet: string[] = this.getDetailSet( week );
			
			/* ???????????????????????????????????? */
			await this.getAllData( week, todayInfoSet, true );
			
			/* ?????????????????? */
			const groupIDs: string[] = await bot.redis.getList( "silvery-star.daily-sub-group" );
			
			const groupData = new DailySet( this.getDataSet( week ), this.eventData );
			await groupData.save( "0" );
			const res: RenderResult = await getRenderResult( "0", false );
			if ( res.code === "ok" ) {
				for ( let id of groupIDs ) {
					//????????????????????????????????????
				}
			} else {
				bot.logger.error( res.error );
				bot.logger.error( "??????????????????????????????????????????????????????????????????" );
			}
			
			/* ?????????????????? */
			const users: string[] = await bot.redis.getKeysByPrefix( "silvery-star.daily-sub-" );
			
			for ( let key of users ) {
				const userID: string = <string>key.split( "-" ).pop();
				const data: DailySet | undefined = await this.getUserSubList( userID );
				if ( data === undefined ) {
					continue;
				}
				await data.save( userID );
				const res: RenderResult = await getRenderResult( userID, true );
				if ( res.code !== "ok" ) {
					const sendToMaster = await bot.message.getSendMasterFunc();
					await sendToMaster( "????????????????????????????????????\n" + res.error );
					continue;
				}
				const randomMinute: number = randomInt( 3, 59 );
				date.setMinutes( randomMinute );
				
				scheduleJob( date, async () => {
					const guildID = await getGidMemberIn( userID );
					if ( !guildID ) {
						bot.logger.error( "??????????????????????????????????????????????????? ID???" + userID );
					} else {
						const sendMessage = await bot.message.getSendPrivateFunc( guildID, userID );
						await sendMessage( { content: "??????????????????", image: res.data } );
					}
				} );
			}
		} );
	}
	
	private static getDateStr( week: number ): string | null {
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
		const param = DailyClass.getDateStr( week );
		return param ? this.detail[param] : [];
	}
	
	private getDataSet( week: number ): InfoResponse[] {
		const param = DailyClass.getDateStr( week );
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
				bot.logger.error( `???${ targetName }?????????????????????: ${ e }` );
			}
		}
	}
	
	private static getWeek( initWeek?: number ): number {
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
		
		/* ???????????????????????? */
		const itemSubList: string[] = subList.filter( s => s !== "??????" );
		
		/* ???????????????????????? */
		const hasEventSub: Boolean = itemSubList.length !== subList.length;
		
		const week: number = DailyClass.getWeek( initWeek );
		if ( this.getDataSet( week ).length === 0 ) {
			const set: string[] = this.getDetailSet( week );
			await this.getAllData( week, set, false );
		}
		
		if ( initWeek ?? subList.length === 0 ) {
			return undefined;
		}
		
		const privateSub: InfoResponse[] = [];
		for ( let item of itemSubList ) {
			const find: InfoResponse | undefined = this.getDataSet( week ).find( el => el.name === item );
			if ( find === undefined ) {
				continue;
			}
			privateSub.push( find );
		}
		if ( privateSub.length === 0 && !hasEventSub ) {
			return undefined;
		}
		
		return new DailySet( privateSub, hasEventSub ? this.eventData : [] );
	}
	
	public async getUserSubscription( userID: string, initWeek?: number ): Promise<{ code: string, data: string }> {
		
		const week: number = DailyClass.getWeek( initWeek );
		if ( initWeek === 7 ) {
			return { code: "error", data: "????????????????????????????????????~" };
		}
		
		const dbKey: string = `adachi-temp-daily-material-${ week }`;
		
		/* ??????????????????????????????????????? */
		const daily = await bot.redis.getString( dbKey );
		if ( daily !== "" ) {
			return { code: "ok", data: daily };
		}
		
		const data: DailySet | undefined = await this.getUserSubList( userID, initWeek === undefined ? undefined : week );
		/* ????????????????????? */
		const subState = data !== undefined;
		const set = data === undefined ? new DailySet( this.getDataSet( week ), this.eventData ) : data;
		
		await set.save( userID );
		const res: RenderResult = await getRenderResult( userID, subState, initWeek === undefined ? undefined : week );
		if ( res.code === "ok" ) {
			await bot.redis.setString( dbKey, res.data, 3600 * 8 ); //????????????????????????????????????
			return res;
		} else {
			return { code: "error", data: res.error };
		}
	}
	
	public async modifySubscription( userID: string, operation: boolean, name: string, isGroup: boolean ): Promise<string> {
		/* ??????/?????????????????? */
		if ( isGroup ) {
			const dbKey: string = "silvery-star.daily-sub-group";
			const exist: boolean = await bot.redis.existListElement( dbKey, name );
			
			if ( exist === operation ) {
				return `?????? ${ name } ${ operation ? "?????????" : "????????????" }`;
			} else if ( operation ) {
				await bot.redis.addListElement( dbKey, name );
			} else {
				await bot.redis.delListElement( dbKey, name );
			}
			
			return `????????????${ operation ? "??????" : "??????" }??????`;
		}
		
		/* ????????????????????? */
		const isEvent: Boolean = name === "??????";
		
		/* ??????/?????????????????? */
		const result: NameResult = getRealName( name );
		
		if ( result.definite || isEvent ) {
			const realName: string = isEvent ? name : <string>result.info;
			const dbKey: string = `silvery-star.daily-sub-${ userID }`;
			const exist: boolean = await bot.redis.existListElement( dbKey, realName );
			
			if ( exist === operation ) {
				return `???${ realName }???${ operation ? "?????????" : "????????????" }`;
			} else if ( operation ) {
				await bot.redis.addListElement( dbKey, realName );
			} else {
				await bot.redis.delListElement( dbKey, realName );
			}
			
			return `??????${ operation ? "??????" : "??????" }??????`;
		} else if ( result.info === "" ) {
			return `??????????????????${ name }??????????????????????????????????????????????????????????????? SilveryStar/Adachi-BOT ????????????`;
		} else {
			return `???????????????????????????????????????${ [ "", ...<string[]>result.info ].join( "\n  - " ) }`;
		}
	}
}