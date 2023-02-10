import { InputParameter } from "@modules/command";
import { Cookies } from "#genshin/module/cookies";
import { Private } from "@plugins/genshin/module/private/main";
import { privateClass, cookies } from "@plugins/genshin/init";
import { ErrorMsg } from "#genshin/utils/promise";
import { checkMysCookieInvalid, getCookiesMap } from "@plugins/genshin/utils/cookie";

/**
Author: Ethereal
CreateTime: 2022/10/3
 */

export async function main(
	{ sendMessage, messageData, file, refresh }: InputParameter
): Promise<void> {
	
	//获取授权服务中的所有cookie -- privateCks
	const userID = messageData.msg.author.id;
	const accounts: Private[] = privateClass.getUserPrivateList( userID );
	
	const validCks: Map<string, string> = new Map<string, string>(); //有效授权
	const invalidCks: Map<string, string> = new Map<string, string>(); //过期授权
	
	for ( const value of accounts ) {
		const mysID = Cookies.checkMysID( value.setting.cookie );
		try {
			await checkMysCookieInvalid( value.setting.cookie );
			validCks.set( mysID, value.setting.cookie );
		} catch ( error ) {
			invalidCks.set( mysID, value.setting.cookie );
		}
	}
	
	/* 对过期CK进行通知 */
	if ( invalidCks.size > 0 ) {
		await sendMessage( [ "以下米游社ID的Cookie已过期", ...invalidCks.keys() ].join( "\n" ) );
	}
	
	if ( validCks.size <= 0 || accounts.length <= 0 ) {
		await sendMessage( `未找到你的有效授权记录，请确认Cookie有效性后使用 ~` );
		return;
	}
	
	//获取Cookies对象中所有cookie -- fileCksMap
	const currentCksMap = getCookiesMap( cookies.getCookies() );
	//合并两个Map
	for ( let [ key, value ] of validCks ) {
		currentCksMap.set( key, value );
	}
	
	const allCks: string[] = Array.from( currentCksMap.values() );
	await sendMessage( "正在添加Cookie，暂停处理指令..." );
	file.writeYAML( "cookies", {
		index: cookies.getIndex(),
		cookies: allCks
	} );
	await refresh.do();
	await sendMessage( `本次已贡献 ${ validCks.size } 个Cookie，感谢你的支持 ~` );
}