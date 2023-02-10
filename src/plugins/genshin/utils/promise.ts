import bot from "ROOT";
import { omit, pick, set } from "lodash";
import { Cookies } from "#genshin/module";
import * as ApiType from "#genshin/types";
import * as api from "#genshin/utils/api";
import { Award, CharacterCon } from "#genshin/types";
import { characterID, cookies } from "#genshin/init";
import {
	getBaseInfo,
	getCalendarDetail,
	getCalendarList, getCookieAccountInfoBySToken,
	getLTokenBySToken,
	getMultiTokenByLoginTicket,
	verifyLtoken
} from "#genshin/utils/api";
import { checkCookieInvalidReason, cookie2Obj, FilterMysCookieResult } from "#genshin/utils/cookie";

export enum ErrorMsg {
	UNKNOWN = "网络未知错误",
	SIGN_MESSAGE = "签到接口报错: ",
	SIGN_VERIFICATION_CODE = "签到接口遇到验证码拦截，请暂时前往米游社手动签到",
	NOTE_VERIFICATION_CODE = "便笺信息查询触发米游社验证码拦截",
	COOKIE_UPTIME = "当前公共Cookie查询次数已用尽，已自动切换，请再次尝试",
	PRIVATE_COOKIE_INVALID = "授权服务Cookie已失效，请及时更换",
	PUBLIC_COOKIE_INVALID = "公共查询Cookie已失效，已自动切换",
	NOT_FOUND = "未查询到角色数据，请检查米哈游通行证（非UID）是否有误或是否设置角色信息公开",
	NOT_PUBLIC = "米游社信息未公开，请前往米游社「个人主页」-「我的角色」右侧「管理」公开信息展示",
	COOKIE_FORMAT_INVALID = `提供的Cookie字段错误，几种Cookie格式请查看教程链接，如有问题请联系官方频道管理员`,
	GET_TICKET_INVAILD = `获取Stoken未知错误`
}

export async function baseInfoPromise(
	userID: string,
	mysID: number,
	cookie: string = ""
): Promise<string> {
	const { retcode, message, data } = await api.getBaseInfo(
		mysID, cookie ? cookie : cookies.get()
	);
	if ( !ApiType.isBBS( data ) ) {
		return Promise.reject( ErrorMsg.UNKNOWN );
	}
	
	return new Promise( async ( resolve, reject ) => {
		if ( retcode === 10001 || retcode !== 0 ) {
			return reject( checkCookieInvalidReason( message, Cookies.checkMysID( cookie ) ) );
		} else if ( !data.list || data.list.length === 0 ) {
			return reject( ErrorMsg.NOT_FOUND );
		}
		
		const genshinInfo: ApiType.Game | undefined = data.list.find( el => el.gameId === 2 );
		if ( !genshinInfo ) {
			return reject( ErrorMsg.NOT_FOUND );
		}
		
		const { gameRoleId, nickname, region, level } = genshinInfo;
		const uid: number = parseInt( gameRoleId );
		
		await bot.redis.setString( `silvery-star.user-querying-id-${ userID }`, uid );
		await bot.redis.setHash( `silvery-star.card-data-${ uid }`, { nickname, uid, level } );
		resolve( region );
	} );
}

export async function detailInfoPromise(
	userID: string,
	server: string,
	cookie: string = ""
): Promise<number[]> {
	const UID: string = await bot.redis.getString( `silvery-star.user-querying-id-${ userID }` );
	if ( UID.length === 0 ) {
		throw ErrorMsg.UNKNOWN;
	}
	
	const detail: any = await bot.redis.getHash( `silvery-star.card-data-${ UID }` );
	const uid: number = parseInt( UID );
	
	if ( detail.stats && detail.avatars && uid === parseInt( detail.uid ) ) {
		if ( !cookie || JSON.parse( detail.avatars ).length > 8 ) {
			bot.logger.info( `[UID ${ uid }] 在一小时内进行过查询操作，将返回上次数据` );
			throw "gotten";
		}
	}
	
	//记录是否使用了公共Cookie
	let isPublic = false;
	if ( cookie.length === 0 ) {
		cookie = cookies.get();
		isPublic = true;
	}
	
	const { retcode, message, data } = await api.getDetailInfo( uid, server, cookie );
	const allHomes = await api.getUidHome();
	
	if ( !ApiType.isUserInfo( data ) ) {
		throw ErrorMsg.UNKNOWN;
	}
	
	/* 信息未公开 */
	if ( retcode === 10102 ) {
		throw ErrorMsg.NOT_PUBLIC;
	} else if ( retcode === 10001 || retcode !== 0 ) {
		throw checkCookieInvalidReason( message, Cookies.checkMysID( cookie ), isPublic );
	}
	
	await bot.redis.setHash( `silvery-star.card-data-${ uid }`, {
		level: parseInt( detail.level ) || data.role.level,
		nickname: data.role.nickname || detail.nickname || "",
		explorations: JSON.stringify( data.worldExplorations ),
		stats: JSON.stringify( data.stats ),
		homes: JSON.stringify( data.homes ),
		allHomes: JSON.stringify( allHomes )
	} );
	bot.redis.setTimeout( `silvery-star.card-data-${ uid }`, 3600 );
	bot.logger.info( `[UID ${ uid }] 查询成功，数据已缓存` );
	
	const charIDs: number[] = data.avatars.map( el => el.id );
	return charIDs;
}

export async function characterInfoPromise(
	userID: string,
	server: string,
	charIDs: number[],
	cookie: string = ""
): Promise<void> {
	const uid: number = parseInt( await bot.redis.getString( `silvery-star.user-querying-id-${ userID }` ) );
	
	//记录是否使用了公共Cookie
	let isPublic = false;
	if ( cookie.length === 0 ) {
		cookie = cookies.get();
		isPublic = true;
	}
	
	const { retcode, message, data } = await api.getCharactersInfo( uid, server, charIDs, cookie );
	
	if ( !ApiType.isCharacter( data ) ) {
		throw ErrorMsg.UNKNOWN;
	}
	
	/* 信息未公开 */
	if ( retcode === 10102 ) {
		await bot.redis.setHash( `silvery-star.card-data-${ uid }`, {
			avatars: JSON.stringify( [] )
		} );
		return;
	} else if ( retcode === 10001 || retcode !== 0 ) {
		throw checkCookieInvalidReason( message, Cookies.checkMysID( cookie ), isPublic )
	}
	
	
	const avatars: ApiType.CharacterInformation[] = [];
	const charList: ApiType.Avatar[] = data.avatars;
	for ( const char of charList ) {
		const base: ApiType.CharacterBase = omit(
			char, [ "image", "weapon", "reliquaries", "constellations" ]
		);
		const weapon: ApiType.CharacterWeapon = {
			...omit( char.weapon, [ "id", "type", "promoteLevel", "typeName" ] ),
			image: `https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/weapon/${ encodeURI( char.weapon.name ) }.png`
		};
		const artifacts: ApiType.CharacterArt = char.reliquaries.map( el => {
			return pick( el, [ "pos", "rarity", "icon", "level" ] );
		} );
		const constellations: ApiType.CharacterCon = {
			detail: char.constellations.map( el => {
				return pick( el, [ "name", "icon", "isActived" ] )
			} ),
			activedNum: char.activedConstellationNum,
			upSkills: char.constellations.reduce( ( pre, cur ) => {
				const reg: RegExp = /<color=#\w+?>(?<name>.+?)<\/color>的技能等级提高(?<level>\d+)级/;
				const res: RegExpExecArray | null = reg.exec( cur.effect );
				if ( res ) {
					const groups = <{ name: string; level: string; }>res.groups;
					pre.push( {
						skillName: groups.name,
						level: parseInt( groups.level ),
						requirementNum: cur.pos
					} );
				}
				return pre;
			}, <ApiType.CharacterConSkill[]>[] )
		};
		
		const tmpSetBucket: Record<string, ApiType.ArtifactSetStat> = {};
		for ( const pos of char.reliquaries ) {
			const id: string = pos.set.name;
			const t = tmpSetBucket[id];
			tmpSetBucket[id] = {
				count: t?.count ? t.count + 1 : 1,
				effect: t?.effect ?? pos.set.affixes,
				icon: t?.icon ?? pos.icon.replace( /\d\.png/, "4.png" )
			};
		}
		const effects: ApiType.CharacterEffect = [];
		for ( const key of Object.keys( tmpSetBucket ) ) {
			const { count, effect, icon } = tmpSetBucket[key];
			effect.forEach( ( { activationNumber: num } ) => {
				if ( count >= num ) {
					const name: string = `${ key } ${ num } 件套`;
					effects.push( { icon, name } );
				}
			} )
		}
		
		avatars.push( { ...base, weapon, constellations, artifacts, effects } );
	}
	
	await bot.redis.setHash( `silvery-star.card-data-${ uid }`, {
		avatars: JSON.stringify( avatars )
	} );
}

export async function mysInfoPromise(
	userID: string,
	mysID: number,
	cookie: string
): Promise<void> {
	const server: string = await baseInfoPromise( userID, mysID, cookie );
	const charIDs = <number[]>await detailInfoPromise( userID, server, cookie );
	await characterInfoPromise( userID, server, charIDs, cookie );
}

export async function mysAvatarDetailInfoPromise(
	uid: string,
	avatar: number,
	server: string,
	cookie: string,
	constellation: CharacterCon
): Promise<ApiType.Skills> {
	const { retcode, message, data } = await api.getAvatarDetailInfo( uid, avatar, server, cookie );
	if ( !ApiType.isAvatarDetail( data ) ) {
		return Promise.reject( ErrorMsg.UNKNOWN );
	}
	
	return new Promise( ( resolve, reject ) => {
		if ( retcode !== 0 ) {
			return reject( ErrorMsg.SIGN_MESSAGE + message );
		}
		
		const skills = data.skillList
			.filter( el => el.levelCurrent !== 0 && el.maxLevel !== 1 )
			.map( el => {
				const temp: ApiType.Skills[number] = pick( el, [ "name", "icon", "levelCurrent" ] );
				constellation.upSkills.forEach( v => {
					if ( temp.name === v.skillName && constellation.activedNum >= v.requirementNum ) {
						temp.levelCurrent += v.level;
					}
				} );
				
				if ( /^普通攻击·(.+?)/.test( temp.name ) ) {
					temp.name = temp.name.slice( 5 );
				}
				
				return temp;
			} );
		
		resolve( skills );
	} );
}

export async function abyssInfoPromise(
	userID: string,
	server: string,
	period: number,
	cookie: string
): Promise<void> {
	const uid: number = parseInt(
		await bot.redis.getString( `silvery-star.abyss-querying-${ userID }` )
	);
	const dbKey: string = `silvery-star.abyss-data-${ uid }`;
	const detail: string = await bot.redis.getString( dbKey );
	
	if ( detail.length !== 0 ) {
		const data: any = JSON.parse( detail );
		if ( data.uid === uid && data.period === period ) {
			bot.logger.info( `[UID ${ uid }] 在一小时内进行过深渊查询操作，将返回上次数据` );
			throw "gotten";
		}
	}
	
	let { retcode, message, data } = await api.getSpiralAbyssInfo( uid, server, period, cookie );
	if ( !ApiType.isAbyss( data ) ) {
		return Promise.reject( ErrorMsg.UNKNOWN );
	}
	
	const idMap: Record<number, string> = {};
	
	for ( const name in characterID.map ) {
		const id = characterID.map[name];
		idMap[id] = name;
	}
	
	const getRankWithName = <T extends { avatarId: number }>( rankList: T[] ) => rankList.map( r => {
		return {
			...r,
			name: idMap[r.avatarId]
		}
	} )
	
	data = {
		...data,
		revealRank: getRankWithName( data.revealRank ),
		defeatRank: getRankWithName( data.defeatRank ),
		takeDamageRank: getRankWithName( data.takeDamageRank ),
		normalSkillRank: getRankWithName( data.normalSkillRank ),
		energySkillRank: getRankWithName( data.energySkillRank ),
		damageRank: getRankWithName( data.damageRank ),
	}
	
	return new Promise( async ( resolve, reject ) => {
		if ( retcode === 10001 || retcode !== 0 ) {
			return reject( checkCookieInvalidReason( message, Cookies.checkMysID( cookie ) ) );
		}
		
		await bot.redis.setString( dbKey, JSON.stringify( { ...data, uid, period } ) );
		bot.redis.setTimeout( dbKey, 3600 );
		bot.logger.info( `[UID ${ uid }] 深渊数据查询成功，数据已缓存` );
		resolve();
	} );
}

export async function ledgerPromise(
	uid: string,
	server: string,
	month: number,
	cookie: string
): Promise<void> {
	const dbKey: string = `silvery-star.ledger-data-${ uid }`;
	const detail: string = await bot.redis.getString( dbKey );
	
	if ( detail.length !== 0 ) {
		const data: any = JSON.parse( detail );
		if ( uid === data.uid.toString() && month === data.dataMonth ) {
			bot.logger.info( `[UID ${ uid }] 在六小时内进行过札记查询操作，将返回上次数据` );
			return Promise.reject( "gotten" );
		}
	}
	
	const { retcode, message, data } = await api.getLedger( uid, server, month, cookie );
	if ( !ApiType.isLedger( data ) ) {
		return Promise.reject( ErrorMsg.UNKNOWN );
	}
	
	return new Promise( async ( resolve, reject ) => {
		if ( retcode === 10001 || retcode !== 0 ) {
			reject( checkCookieInvalidReason( message, Cookies.checkMysID( cookie ) ) );
			return;
		}
		
		await bot.redis.setString( dbKey, JSON.stringify( data ) );
		bot.redis.setTimeout( dbKey, 21600 );
		bot.logger.info( `[UID ${ uid }] 札记数据查询成功，数据已缓存` );
		resolve();
	} );
}

export async function dailyNotePromise(
	uid: string,
	server: string,
	cookie: string
): Promise<ApiType.Note> {
	return new Promise( async ( resolve, reject ) => {
		try {
			const { retcode, message, data } = await api.getDailyNoteInfo(
				parseInt( uid ), server, cookie
			);
			if ( !ApiType.isNote( data ) ) {
				return reject( ErrorMsg.UNKNOWN );
			}
			
			if ( retcode === 1034 ) {
				return reject( checkCookieInvalidReason( ErrorMsg.NOTE_VERIFICATION_CODE, parseInt( uid ) ) );
			}
			
			if ( retcode === 10001 || retcode !== 0 ) {
				const errMsg = retcode === 1034 ? ErrorMsg.NOTE_VERIFICATION_CODE : message;
				return reject( checkCookieInvalidReason( errMsg, Cookies.checkMysID( cookie ) ) );
			}
			
			bot.logger.debug( `[UID ${ uid }] 实时便笺数据查询成功` );
			resolve( data );
		} catch ( error ) {
			reject( "便笺数据查询错误，可能服务器出现了网络波动或米游社API故障，请联系开发者进行反馈" );
		}
	} );
}

export async function signInInfoPromise(
	uid: string,
	server: string,
	cookie: string
): Promise<ApiType.SignInInfo> {
	const { retcode, message, data } = await api.getSignInInfo( uid, server, cookie );
	if ( !ApiType.isSignInInfo( data ) ) {
		return Promise.reject( ErrorMsg.UNKNOWN );
	}
	
	return new Promise( ( resolve, reject ) => {
		if ( retcode === -100 || retcode !== 0 ) {
			return reject( checkCookieInvalidReason( message, parseInt( uid ) ) );
		}
		
		bot.logger.debug( `[UID ${ uid }] 米游社签到数据查询成功` );
		resolve( data );
	} );
}

export async function signInResultPromise(
	uid: string,
	server: string,
	cookie: string
): Promise<ApiType.SignInResult> {
	const { retcode, message, data } = await api.mihoyoBBSSignIn( uid, server, cookie );
	if ( !ApiType.isSignInResult( data ) ) {
		return Promise.reject( ErrorMsg.UNKNOWN );
	}
	
	return new Promise( ( resolve, reject ) => {
		if ( retcode === -100 || retcode !== 0 ) {
			return reject( checkCookieInvalidReason( message, Cookies.checkMysID( cookie ) ) );
		} else if ( data.gt || data.success !== 0 ) {
			return reject( checkCookieInvalidReason( ErrorMsg.SIGN_VERIFICATION_CODE, parseInt( uid ) ) );
		}
		
		bot.logger.info( `[UID ${ uid }] 今日米游社签到成功` );
		resolve( data );
	} );
}

export async function SinInAwardPromise(): Promise<Award[]> {
	const { retcode, message, data } = await api.getSignInReward();
	await bot.redis.setString( `adachi.genshin-sign-in-award`, JSON.stringify( data.awards ), 3600 * 24 );
	bot.logger.info( "签到奖励列表已获取" );
	return data.awards;
}

export async function calendarPromise(): Promise<ApiType.CalendarData[]> {
	const { data: detail, retcode: dRetCode, message: dMessage } = await getCalendarDetail();
	const { data: list, retcode: lRetCode, message: lMessage } = await getCalendarList();
	if ( !ApiType.isCalendarDetail( detail ) || !ApiType.isCalendarList( list ) ) {
		throw ErrorMsg.UNKNOWN;
	}
	
	if ( dRetCode !== 0 ) {
		throw ErrorMsg.SIGN_MESSAGE + dMessage;
	}
	
	if ( lRetCode !== 0 ) {
		throw ErrorMsg.SIGN_MESSAGE + lMessage;
	}
	
	const ignoredReg = /(修复|社区|周边|礼包|问卷|调研|版本|创作者|米游社|pv|问题处理|有奖活动|内容专题页|专项意见|更新|防沉迷|公平运营|先行展示页|预下载|新剧情|邀约事件|传说任务)/i;
	
	const detailInfo: Record<number, ApiType.CalendarDetailItem> = {};
	for ( const d of detail.list ) {
		detailInfo[d.annId] = d;
	}
	
	/* 日历数据 */
	const calcDataList: ApiType.CalendarData[] = [];
	
	/* 整理列表数据为一个数组 */
	const postList: ApiType.CalendarListItem[] = [];
	for ( const l of list.list ) {
		postList.push( ...l.list );
	}
	
	const verReg = /(\d\.\d)版本更新/;
	const verTimeReg = /更新时间\s*〓((\d+\/){2}\d+\s+(\d+:){2}\d+)/;
	
	/* 清除字段内 html 标签 */
	const remHtmlTags = ( content: string ) => content.replace( /(<|&lt;).+?(>|&gt;)/g, "" );
	
	/* 记录版本更新时间 */
	const verDbKey = "silvery-star.calendar-version-time";
	const verTimeInfo: Record<string, number> = await bot.redis.getHash( verDbKey );
	const verLength = Object.keys( verTimeInfo ).length;
	
	/* 获取与版本更新有关的文章 */
	const updatePosts = postList.filter( l => verReg.test( l.title ) );
	for ( const post of updatePosts ) {
		const detailItem = detailInfo[post.annId];
		if ( !detailItem ) continue;
		
		/* 查找新版本开始时间 */
		const verRet = verReg.exec( post.title );
		if ( !verRet || !verRet[1] ) continue;
		
		const content = remHtmlTags( detailItem.content );
		const verTimeRet = verTimeReg.exec( content );
		
		if ( !verTimeRet || !verTimeRet[1] ) continue;
		
		const time = new Date( verTimeRet[1] ).getTime()
		if ( !Number.isNaN( time ) ) {
			verTimeInfo[verRet[1]] = time;
		}
	}
	/* 版本号数据存在变动，更新 */
	if ( Object.keys( verTimeInfo ).length !== verLength ) {
		await bot.redis.setHash( verDbKey, verTimeInfo );
	}
	
	for ( const post of postList ) {
		/* 过滤非活动公告 */
		if ( ignoredReg.test( post.title ) ) {
			continue;
		}
		
		let start = new Date( post.startTime ).getTime();
		const end = new Date( post.endTime ).getTime();
		
		/* 若存在详情，修正列表数据的开始时间 */
		const detailItem = detailInfo[post.annId];
		if ( detailItem ) {
			/* 修正开始时间 */
			const content = remHtmlTags( detailItem.content );
			const vRet = /(\d\.\d)版本更新后/.exec( content );
			if ( vRet && vRet[1] ) {
				/* 版本更新活动 */
				const cTime = verTimeInfo[vRet[1]];
				if ( cTime ) {
					start = cTime;
				}
			} else {
				/* 普通活动 */
				const dateList = content.match( /(\d+\/){2}\d+\s+(\d+:){2}\d+/ );
				const cDateStr = dateList && dateList[0];
				if ( cDateStr ) {
					const cTime = new Date( cDateStr ).getTime();
					if ( cTime > start && cTime < end ) {
						start = cTime;
					}
				}
			}
		}
		
		calcDataList.push( {
			banner: post.banner,
			title: post.title,
			subTitle: post.subtitle,
			startTime: start,
			endTime: end
		} );
	}
	bot.logger.info( "活动数据查询成功" );
	return calcDataList;
}


export async function getCookieTokenBySToken(
	stoken: string,
	mid: string,
	uid: string ): Promise<{ uid: string, cookie_token: string }> {
	const { retcode, message, data } = await api.getCookieAccountInfoBySToken( stoken, mid, uid );
	
	if ( !ApiType.isCookieTokenResult( data ) ) {
		return Promise.reject( ErrorMsg.UNKNOWN );
	}
	
	return new Promise( ( resolve, reject ) => {
		if ( retcode === -100 || retcode !== 0 ) {
			throw checkCookieInvalidReason( message, parseInt( uid ) );
		}
		resolve( {
			uid: data.uid,
			cookie_token: data.cookieToken
		} );
	} );
}

export async function getMultiToken( mysID, cookie ): Promise<any> {
	
	const { login_ticket } = cookie2Obj( cookie );
	if ( !login_ticket ) {
		throw "cookie缺少login_ticket无法生成获取Stoken";
	}
	if ( !cookie.includes( "stuid" ) ) {
		cookie = cookie + ";stuid=" + mysID;
	}
	if ( !cookie.includes( "login_uid" ) ) {
		cookie = cookie + ";login_uid=" + mysID;
	}
	
	const { retcode, message, data } = await getMultiTokenByLoginTicket( mysID, login_ticket, cookie );
	if ( !ApiType.isMultiToken( data ) ) {
		throw ErrorMsg.UNKNOWN;
	} else if ( !data.list || data.list.length === 0 ) {
		throw ErrorMsg.GET_TICKET_INVAILD;
	}
	
	return new Promise( ( resolve, reject ) => {
		if ( retcode === 1001 || retcode !== 0 ) {
			return reject( checkCookieInvalidReason( message, mysID ) );
		}
		let cookie = {};
		data.list.forEach( value => {
			// cookie += `${ value.name }=${ value.token }; `;
			cookie = set( cookie, value.name, value.token );
		} );
		resolve( cookie );
	} );
}

export async function getMidByLtoken( ltoken: string, ltuid: string ): Promise<string> {
	const { retcode, message, data } = await verifyLtoken( ltoken, ltuid );
	if ( !ApiType.isVerifyLtoken( data ) ) {
		throw ErrorMsg.UNKNOWN;
	}
	return new Promise( ( resolve, reject ) => {
		if ( retcode === 1001 || retcode !== 0 ) {
			return reject( checkCookieInvalidReason( message, ltuid ) );
		}
		resolve( data.userInfo.mid );
	} );
}

export async function getLtoken( stoken: string, mid: string ): Promise<string> {
	const { retcode, message, data } = await getLTokenBySToken( stoken, mid );
	if ( !ApiType.isGetLtoken( data ) ) {
		throw ErrorMsg.UNKNOWN;
	}
	return new Promise( ( resolve, reject ) => {
		if ( retcode === 1001 || retcode !== 0 ) {
			return reject( checkCookieInvalidReason( message ) );
		}
		resolve( data.ltoken );
	} );
}