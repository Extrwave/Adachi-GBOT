import bot from "ROOT";
import { MessageType, SendFunc } from "@modules/message";
import { AuthLevel } from "@modules/management/auth";
import { Order } from "@modules/command";
import { NoteService } from "./note";
import { MysQueryService } from "./mys";
import { AbyQueryService } from "./abyss";
import { CharQueryService } from "#genshin/module/private/char";
import { SignInService } from "./sign";
import { Md5 } from "md5-typescript";
import { pull } from "lodash";
import { getRegion } from "#genshin/utils/region";

export interface Service {
	parent: Private;
	FixedField: string;
	getOptions(): any;
	initTest(): Promise<string>;
	loadedHook?(): Promise<any>;
}

/* 获取元组第一位 */
type TupleHead<T extends any[]> = T[0];
/* 弹出元组第一位 */
type TupleShift<T extends Service[]> = T extends [ infer L, ...infer R ] ? R : never;
/* 合并交叉类型 */
type Merge<T> = { [P in keyof T]: T[P] };
/* 向接口中添加新字段 */
type ObjectExpand<T, U extends Service> = Merge<{ [P in keyof T]: T[P] } &
	{ [P in U["FixedField"]]: U }>;
/* 定义扩展授权服务的基本接口 */
type BasicExpand = Record<string, Service>;
/* 递归定义扩展授权服务类型 */
type ExpandedService<T extends any[], E extends BasicExpand = {}> = T extends []
	? E
	: ExpandedService<TupleShift<T>, ObjectExpand<E, TupleHead<T>>>;
/* 定义扩展私有服务 */
type ServiceTuple = [
	NoteService, SignInService, MysQueryService,
	AbyQueryService, CharQueryService
];
/* 获取扩展授权服务类型 */
type Services = ExpandedService<ServiceTuple>;

export class UserInfo {
	public readonly uid: string;
	public readonly server: string;
	public readonly userID: string;
	public readonly mysID: number;
	public cookie: string;
	
	constructor( uid: string, cookie: string, userID: string, mysID: number ) {
		this.uid = uid;
		this.cookie = cookie;
		this.userID = userID;
		this.mysID = mysID;
		this.server = getRegion( uid[0] );
	}
}

const dbPrefix: string = "silvery-star.private-";

/*
* 依据 https://github.com/SilveryStar/Adachi-BOT/issues/70#issuecomment-946331850 重新设计
* */
export class Private {
	public readonly setting: UserInfo;
	public readonly services: Services;
	public readonly sendMessage: SendFunc;
	public readonly dbKey: string;
	
	public id: number;
	public options: Record<string, any>;
	
	static parse( data: Record<string, any> ): Private {
		if ( !data.setting.mysID ) {
			const reg = new RegExp( /.*?ltuid=([0-9]+).*?/g );
			const execRes = <RegExpExecArray>reg.exec( data.setting.cookie );
			data.setting.mysID = parseInt( execRes[1] );
		}
		return new Private(
			data.setting.uid, data.setting.cookie,
			data.setting.userID, data.setting.mysID,
			data.id, data.options
		);
	}
	
	constructor(
		uid: string, cookie: string,
		userID: string, mysID: number,
		id: number, options?: Record<string, any>
	) {
		this.options = options || {};
		this.setting = new UserInfo( uid, cookie, userID, mysID );
		let guildID = "";
		bot.redis.getString( `adachi.guild-id` ).then( ( value ) => {
			guildID = value;
		} );
		this.sendMessage = bot.message.getPrivateSendFunc( guildID, userID );
		
		const md5: string = Md5.init( `${ userID }-${ uid }` );
		this.id = id;
		this.dbKey = dbPrefix + md5;
		this.services = {
			[NoteService.FixedField]: new NoteService( this ),
			[SignInService.FixedField]: new SignInService( this ),
			[MysQueryService.FixedField]: new MysQueryService( this ),
			[AbyQueryService.FixedField]: new AbyQueryService( this ),
			[CharQueryService.FixedField]: new CharQueryService( this )
		};
		this.options = this.globalOptions();
	}
	
	private globalOptions(): any {
		const options = {};
		for ( let k of Object.keys( this.services ) ) {
			options[k] = this.services[k].getOptions();
		}
		return options;
	}
	
	public stringify(): string {
		return JSON.stringify( {
			setting: this.setting,
			options: this.options
		} );
	}
	
	public async refreshDBContent( field?: string ): Promise<void> {
		if ( field ) {
			this.options[field] = this.services[field].getOptions();
		}
		await bot.redis.setString( this.dbKey, this.stringify() );
	}
	
	public async replaceCookie( cookie: string ): Promise<void> {
		this.setting.cookie = cookie;
		await bot.redis.setString( this.dbKey, this.stringify() );
	}
	
	public updateID( id: number ): void {
		this.id = id;
		this.refreshDBContent();
	}
}

export class PrivateClass {
	private readonly list: Private[];
	
	constructor() {
		this.list = [];
		const tempIDs: Record<number, number> = {};
		
		bot.redis.getKeysByPrefix( dbPrefix ).then( async ( keys: string[] ) => {
			for ( let k of keys ) {
				const data = await bot.redis.getString( k );
				if ( !data ) {
					continue;
				}
				const obj: Record<string, any> = JSON.parse( data );
				if ( !obj.id ) {
					const id: number = obj.setting.userID;
					tempIDs[id] = tempIDs[id] ? tempIDs[id] + 1 : 1;
					obj.id = tempIDs[id];
					await bot.redis.setString( k, JSON.stringify( obj ) );
				}
				const account = Private.parse( obj );
				this.list.push( account );
				
				for ( let s of <Service[]>Object.values( account.services ) ) {
					if ( s.loadedHook ) {
						await s.loadedHook();
					}
				}
			}
		} );
	}
	
	public getUserIDList(): string[] {
		const userIdList = this.list.map( el => el.setting.userID );
		return Array.from( new Set( userIdList ) );
	}
	
	public getUserPrivateList( userID: string ): Private[] {
		return this.list
			.filter( el => el.setting.userID === userID )
			.sort( ( x, y ) => x.id - y.id );
	}
	
	public async getSinglePrivate( userID: string, privateID: number ): Promise<Private | string> {
		const list: Private[] = this.getUserPrivateList( userID );
		const auth: AuthLevel = await bot.auth.get( userID );
		if ( privateID > list.length || privateID === 0 ) {
			const PRIVATE_LIST = <Order>bot.command.getSingle(
				"silvery-star.private-list", auth
			);
			return `无效的序号，请使用 ${ PRIVATE_LIST.getHeaders()[0] } 检查，序号为前面数字，不是UID`;
		} else {
			return list[privateID - 1];
		}
	}
	
	public getUserInfoList( userID: string ): UserInfo[] {
		return this.getUserPrivateList( userID ).map( el => el.setting );
	}
	
	public async addPrivate( uid: string, cookie: string, userID: string ): Promise<string> {
		const list: Private[] = this.getUserPrivateList( userID );
		const auth: AuthLevel = await bot.auth.get( userID );
		const PRIVATE_UPGRADE = <Order>bot.command.getSingle( "silvery-star.private-replace", auth );
		if ( list.some( el => el.setting.uid === uid ) ) {
			return `UID${ uid } 的私人服务已经申请` + `如需更新请使用『${ PRIVATE_UPGRADE.getHeaders()[0] }』指令`;
		}
		const reg = new RegExp( /.*?ltuid=([0-9]+).*?/g );
		const execRes = <RegExpExecArray>reg.exec( cookie );
		const mysID: number = parseInt( execRes[1] );
		
		const userAddedList: Private[] = this.getUserPrivateList( userID );
		const newPrivate = new Private( uid, cookie, userID, mysID, userAddedList.length + 1 );
		this.list.push( newPrivate );
		await bot.redis.setString( newPrivate.dbKey, newPrivate.stringify() );
		
		const values: Service[] = Object.values( newPrivate.services );
		const contents: string[] = await Promise.all( values.map( async el => await el.initTest() ) );
		return `授权服务开启成功，UID: ${ uid }` + [ "", ...contents ].join( "\n" );
	}
	
	public async delPrivate( p: Private ): Promise<void> {
		Object.values( p.services ).forEach( ( service ) => {
			if ( 'toggleEnableStatus' in service ) {
				service.toggleEnableStatus( false, false );
			}
		} )
		pull( this.list, p );
		await bot.redis.deleteKey( p.dbKey );
	}
	
	/* 移除指定用户的某个私人服务 */
	public async delSinglePrivate( userID: string, privateID: number ): Promise<string> {
		const single: Private | string = await this.getSinglePrivate( userID, privateID );
		if ( typeof single === "string" ) {
			return single;
		} else {
			await this.delPrivate( single );
			return "私人服务取消成功";
		}
	}
	
	/* 批量移除指定用户的私人服务 */
	public async delBatchPrivate( userID: string ): Promise<string> {
		const privateList: Private[] = this.getUserPrivateList( userID );
		
		for ( const batch of privateList ) {
			await this.delPrivate( batch );
		}
		
		return `用户${ userID }的私人服务已全部移除`;
	}
}