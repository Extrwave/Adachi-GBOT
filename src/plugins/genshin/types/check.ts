import { ResponseDataType } from "./response";
import { Abyss } from "./abyss";
import { BBS } from "./hoyobbs";
import { Character } from "./character";
import { UserInfo } from "./user-info";
import { CharacterInfo, InfoResponse, WeaponInfo } from "./info";
import { Note } from "./note";
import { SignInAward, SignInInfo, SignInResult } from "./sign-in";
import { Ledger } from "#genshin/types/ledger";
import { AvatarDetailRaw } from "#genshin/types/avatar";
import { CalendarList, CalendarDetail } from "#genshin/types/calendar";
import { MutiTokenResult, CookieToken, VerifyLtoken, GetLtoken } from "#genshin/types/cookie";


/* 对于米游社 API 返回数据的类型检查 */
export function isAbyss( obj: ResponseDataType ): obj is Abyss {
	return obj.type === "abyss";
}

export function isBBS( obj: ResponseDataType ): obj is BBS {
	return obj.type === "bbs";
}

export function isCharacter( obj: ResponseDataType ): obj is Character {
	return obj.type === "character";
}

export function isUserInfo( obj: ResponseDataType ): obj is UserInfo {
	return obj.type === "user-info";
}

export function isNote( obj: ResponseDataType ): obj is Note {
	return obj.type === "note";
}

export function isSignInInfo( obj: ResponseDataType ): obj is SignInInfo {
	return obj.type === "sign-in-info";
}

export function isSignInResult( obj: ResponseDataType ): obj is SignInResult {
	return obj.type === "sign-in-result";
}

export function isLedger( obj: ResponseDataType ): obj is Ledger {
	return obj.type === "ledger";
}

export function isAvatarDetail( obj: ResponseDataType ): obj is AvatarDetailRaw {
	return obj.type === "avatar";
}

export function isCalendarList( obj: ResponseDataType ): obj is CalendarList {
	return obj.type === "calendar-list";
}

export function isCalendarDetail( obj: ResponseDataType ): obj is CalendarDetail {
	return obj.type === "calendar-detail";
}

export function isSignInAward( obj: ResponseDataType ): obj is SignInAward {
	return obj.type === "sign-in-award";
}


export function isCookieTokenResult( obj: ResponseDataType ): obj is CookieToken {
	return obj.type === "cookie-token";
}

export function isMultiToken( obj: ResponseDataType ): obj is MutiTokenResult {
	return obj.type === "multi-token";
}

export function isVerifyLtoken( obj: ResponseDataType ): obj is VerifyLtoken {
	return obj.type === "verify-ltoken";
}

export function isGetLtoken( obj: ResponseDataType ): obj is GetLtoken {
	return obj.type === "get-ltoken";
}

/* 对于 OSS 返回数据的类型检查 */
export function isWeaponInfo( obj: InfoResponse ): obj is WeaponInfo {
	return obj.type === "武器";
}

export function isCharacterInfo( obj: InfoResponse ): obj is CharacterInfo {
	return obj.type === "角色";
}