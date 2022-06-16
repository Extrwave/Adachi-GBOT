import bot from "ROOT"
import { getRealName, NameResult } from "../utils/name";
import { scheduleJob } from "node-schedule";
import { isCharacterInfo, isWeaponInfo, InfoResponse } from "../types";
import { randomInt } from "../utils/random";
import { getDailyMaterial, getInfo } from "../utils/api";
import { take } from "lodash";
import { RenderResult } from "@modules/renderer";
import { renderer } from "#genshin/init";

export interface DailyMaterial {
	"Mon&Thu": string[];
	"Tue&Fri": string[];
	"Wed&Sat": string[];
}

interface DailyInfo {
	name: string;
	rarity: number;
}

export class DailySet {
	private readonly weaponSet: Record<string, DailyInfo[]>;
	private readonly characterSet: Record<string, DailyInfo[]>;
	
	constructor( data: InfoResponse[] ) {
		this.weaponSet = {};
		this.characterSet = {};
		
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
			`silvery-star-daily-temp-${ id }`, {
				weapon: JSON.stringify( this.weaponSet ),
				character: JSON.stringify( this.characterSet )
			} );
	}
}

async function getRenderResult( id: string ): Promise<RenderResult> {
	return await renderer.asUrlImage( "/daily.html", { id } );
}

export class DailyClass {
	private detail: DailyMaterial;
	private allData: InfoResponse[] = [];
	
	constructor() {
		this.detail = { "Mon&Thu": [], "Tue&Fri": [], "Wed&Sat": [] };
		getDailyMaterial().then( ( result: DailyMaterial ) => {
			this.detail = result;
		} );
		scheduleJob( "0 0 0 * * *", async () => {
			this.detail = await getDailyMaterial();
		} );
		
		scheduleJob( "0 0 6 * * *", async () => {
			const date: Date = new Date();
			await bot.redis.deleteKey( `extr-wave-dailyMaterial` );
			await this.getUserSubscription( bot.config.master );
			bot.logger.info( "每日材料已重新加载" );
			
			
			/* 获取当日副本对应的角色和武器 */
			let week: number = date.getDay();
			week = date.getHours() < 4 ? week === 0 ? 6 : week - 1 : week;
			const todayInfoSet: string[] = this.getDailySet( week );
			
			/* 获取所有角色和武器的信息 */
			await this.getAllData( week, todayInfoSet );
			
			/* 群发订阅信息 */
			const groupIDs: string[] = await bot.redis.getList( "silvery-star-daily-sub-group" );
			
			const groupData = new DailySet( this.allData );
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
				} else if ( res.code === "error" ) {
					bot.logger.error( res.error );
				} else {
					bot.logger.error( res.err );
					bot.logger.error( "每日素材订阅图片渲染异常，请查看日志进行检查" );
				}
			}
			for ( let id of groupIDs ) {
				await bot.client.messageApi.postMessage( id, { content: subMessage } );
				if ( subMessageImage !== null ) {
					await bot.client.messageApi.postMessage( id, subMessageImage );
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
					await bot.logger.info( userID, res.data );
				} );
			}
		} );
	}
	
	private getDailySet( week: number ): string[] {
		if ( week === 1 || week === 4 ) {
			return this.detail["Mon&Thu"];
		} else if ( week === 2 || week === 5 ) {
			return this.detail["Tue&Fri"];
		} else if ( week === 3 || week === 6 ) {
			return this.detail["Wed&Sat"];
		} else {
			return [];
		}
	}
	
	private async getAllData( week: number, set: string[] ): Promise<void> {
		this.allData = [];
		if ( week === 0 ) {
			return;
		}
		for ( let targetName of set ) {
			try {
				const data = await getInfo( targetName );
				if ( typeof data !== "string" ) {
					this.allData.push( data );
				}
			} catch ( e ) {
				bot.logger.error( `「${ targetName }」信息获取失败: ${ e }` );
				continue;
			}
		}
	}
	
	private async getUserSubList( userID: string ): Promise<DailySet | undefined> {
		const dbKey: string = `silvery-star-daily-sub-${ userID }`;
		const subList: string[] = await bot.redis.getList( dbKey );
		if ( this.allData.length === 0 ) {
			const date = new Date();
			let week: number = date.getDay();
			week = date.getHours() < 4 ? week === 0 ? 6 : week - 1 : week;
			const set: string[] = this.getDailySet( week );
			await this.getAllData( week, set );
		}
		if ( subList.length === 0 ) {
			return undefined;
		}
		
		const privateSub: InfoResponse[] = [];
		for ( let item of subList ) {
			const find: InfoResponse | undefined = this.allData.find( el => el.name === item );
			if ( find === undefined ) {
				continue;
			}
			privateSub.push( find );
		}
		if ( privateSub.length === 0 ) {
			return undefined;
		}
		
		return new DailySet( privateSub );
	}
	
	public async getUserSubscription( userID: string ): Promise<string> {
		const date: Date = new Date();
		
		let week: number = date.getDay();
		week = date.getHours() < 4 ? week === 0 ? 6 : week - 1 : week;
		if ( week === 0 ) {
			return "周日所有材料都可以刷取哦~";
		}
		
		const data: DailySet | undefined = await this.getUserSubList( userID );
		const set = data === undefined ? new DailySet( this.allData ) : data;
		
		await set.save( userID );
		const res: RenderResult = await getRenderResult( userID );
		if ( res.code === "ok" ) {
			return res.data;
		} else if ( res.code === "error" ) {
			bot.logger.error( res.error );
			return res.error;
		} else {
			bot.logger.error( res.err );
			return "图片渲染异常，请联系持有者进行反馈";
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
			return `未找到名为「${ name }」的角色或武器，若确认名称输入无误，请前往 github.com/SilveryStar/Adachi-BOT 进行反馈`;
		} else {
			return `未找到相关信息，是否要找：${ [ "", ...<string[]>result.info ].join( "\n  - " ) }`;
		}
	}
}