import { InputParameter } from "@modules/command";
import { getRealName, NameResult } from "#genshin/utils/name";
import { characterId, config, renderer } from "#mari-plugin/init";
import { charaDetailPromise, ErrorMsg } from "#mari-plugin/utils/promise";
import { RenderResult } from "@modules/renderer";
import * as ApiType from "#mari-plugin/types";
import { typeData } from "#genshin/init";
import { getUID, isAt } from "#mari-plugin/utils/message";
import { getPrivateAccount } from "@plugins/genshin/utils/private";
import { Private } from "@plugins/genshin/module/private/main";
import { getMemberAvatar } from "@modules/utils/account";

export async function main( { sendMessage, messageData, redis, logger }: InputParameter ): Promise<void> {
	const msg: string = messageData.msg.content;
	const userID: string = messageData.msg.author.id;
	const parser = /([\u4e00-\u9fa5]+)\s*(\d+)?\s*(<@!\d+>)?/i;
	const execRes = parser.exec( msg );
	if ( !execRes ) {
		await sendMessage( "参数格式有误" );
		return;
	}
	
	const [ , name, uidStr, atMsg ] = execRes;
	const orderQuery: boolean = !!( uidStr && uidStr.length !== 9 );
	
	if ( !config.uidQuery && ( !orderQuery || atMsg ) ) {
		await sendMessage( "bot 持有者已关闭 uid 和 @ 查询功能" );
		return;
	}
	
	//判断是否序号查询
	let uid: number, target: string, isSelf: boolean, isStranger: boolean;
	if ( orderQuery ) {
		const account: Private | string = await getPrivateAccount( userID, uidStr );
		if ( typeof account === "string" ) {
			await sendMessage( account );
			return;
		}
		uid = parseInt( account.setting.uid );
		target = userID;
		isSelf = true;
		isStranger = false;
	} else {
		const atID: string | undefined = isAt( atMsg );
		/* 检查是否绑定了uid */
		const { info, stranger, self } = await getUID( uidStr || atMsg, userID, redis, atID );
		if ( typeof info === "string" ) {
			await sendMessage( info );
			return;
		}
		uid = info;
		isSelf = self;
		isStranger = stranger;
		target = atID ? atID : userID;
	}
	
	/* 获取查询的角色id */
	const result: NameResult = getRealName( name );
	if ( !result.definite ) {
		const message: string = result.info.length === 0
			? "查询失败，请检查角色名称是否正确"
			: `未找到相关信息，是否要找：${ [ "", ...<string[]>result.info ].join( "\n  - " ) }`;
		await sendMessage( message );
		return;
	}
	const realName: string = <string>result.info;
	
	const charID: number = characterId.map[realName];
	
	/* 因无法获取属性，排除旅行者 */
	if ( charID === -1 ) {
		await sendMessage( `暂不支持查看「${ realName }」的面板详细信息` );
		return;
	}
	
	let detail: ApiType.Detail;
	
	try {
		detail = await charaDetailPromise( uid, isSelf, sendMessage, false );
	} catch ( error ) {
		if ( typeof error === "string" ) {
			await sendMessage( <string>error );
		} else {
			await sendMessage( "整理数据出错，请前往控制台查看错误信息" );
			logger.error( error );
		}
		return;
	}
	
	/* 获取所选角色的信息 */
	const currentChara = detail.avatars.find( a => {
		return charID === -1 ? a.id === 10000005 || a.id === 10000007 : a.id === charID;
	} );
	
	if ( !currentChara ) {
		const errorMsg = isSelf ? ErrorMsg.SELF_NOT_FOUND : ErrorMsg.NOT_FOUND;
		await sendMessage( errorMsg.replace( "$", realName ) );
		return;
	}
	
	/* 获取所选角色属性 */
	const element = typeData.character[realName] === "!any!" ? "none" : typeData.character[realName];
	
	const avatar = isStranger ? "" : await getMemberAvatar( target );
	await redis.setString( `mari-plugin.chara-detail-${ uid }`, JSON.stringify( {
		uid,
		avatar,
		username: detail.nickname,
		element,
		...currentChara
	} ) );
	const res: RenderResult = await renderer.asLocalImage(
		"/chara-detail.html", { uid: uid } );
	if ( res.code === "local" ) {
		await sendMessage( { file_image: res.data } );
	} else if ( res.code === "url" ) {
		await sendMessage( { image: res.data } );
	} else {
		await sendMessage( res.data );
	}
}
