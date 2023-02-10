import bot from "ROOT";
import { getCharaDetail } from "#mari-plugin/utils/api";
import { enKaClass } from "#mari-plugin/init";
import { EnKa } from "#mari-plugin/utils/enka";
import { config } from "#mari-plugin/init";
import { SendFunc } from "@modules/message";
import * as ApiType from "#mari-plugin/types"

export enum ErrorMsg {
	IS_PENDING = "两次请求间隔较短，请于 $ 后再次尝试",
	PRIVATE_ACCOUNT = "对方未开启「显示角色详情」，无法查询",
	SELF_PRIVATE_ACCOUNT = "请在游戏中打开「显示角色详情」后再次尝试。",
	NOT_FOUND = "对方未将「$」展示在角色展柜中。",
	SELF_NOT_FOUND = "请确认「$」已被展示在游戏的角色展柜中。",
	PANEL_EMPTY = "对方未再展示柜中添加任何角色",
	SELF_PANEL_EMPTY = "请在角色展柜中设置需要展示的角色",
	FORM_MESSAGE = "EnKa接口报错: ",
	UNKNOWN = "发生未知错误，请尝试重新获取数据"
}

function getLimitTime( differ: number ): string {
	differ = Math.floor( differ / 1000 );
	const min = Math.floor( differ / 60 );
	const sec = ( differ % 60 ).toString().padStart( 2, "0" );
	return `${ min }分${ sec }秒`;
}

export async function charaDetailPromise( uid: number, self: boolean, sendMessage: SendFunc, isUpdate: boolean ): Promise<ApiType.Detail> {
	const dbKey: string = `mari-plugin.chara-detail-list-${ uid }`;
	const dbKeyTimeout: string = `ari-plugin.chara-detail-time-${ uid }`;
	
	const detailStr: string = await bot.redis.getString( dbKey );
	const updateTime: string = await bot.redis.getString( dbKeyTimeout );
	
	const limitWait: number = 3 * 60 * 1000;
	let detail: ApiType.Detail | null = detailStr ? JSON.parse( detailStr ) : null;
	
	
	/* 检查是否频繁请求 */
	if ( updateTime && ( isUpdate || ( !isUpdate && !detail ) ) ) {
		const differ = new Date().getTime() - parseInt( updateTime );
		if ( differ <= limitWait ) {
			const limit = getLimitTime( limitWait - differ );
			throw ErrorMsg.IS_PENDING.replace( "$", limit );
		}
	}
	
	if ( !detail || isUpdate ) {
		const msgUser = self ? "" : `「${ uid }」`;
		const startMsg = isUpdate ? `开始更新${ msgUser }面板数据，请稍后……` : "正在获取数据，请稍后……";
		await sendMessage( startMsg );
		
		let data: ApiType.EnKa;
		try {
			data = await getCharaDetail( config.enKaApi, uid );
		} catch ( error ) {
			throw ErrorMsg.FORM_MESSAGE + error;
		}
		
		if ( !data?.playerInfo ) {
			throw ErrorMsg.FORM_MESSAGE + "未能成功获取到数据，请重试";
		}
		
		await bot.redis.setString( dbKeyTimeout, new Date().getTime() );
		
		/* 未展示任何角色 */
		if ( !data.playerInfo.showAvatarInfoList ) {
			throw self ? ErrorMsg.SELF_PANEL_EMPTY : ErrorMsg.PANEL_EMPTY;
		}
		
		/* 未开启查看详情 */
		if ( !data.avatarInfoList ) {
			throw self ? ErrorMsg.SELF_PRIVATE_ACCOUNT : ErrorMsg.PRIVATE_ACCOUNT;
		}
		
		let oldAvatars: ApiType.Avatar[] = detail?.avatars || [];
		
		const { meta, chara, artifact } = enKaClass;
		detail = new EnKa( meta, chara, artifact ).getDetailInfo( data );
		
		/* 我也不知道为什么有的人报错，总之我先放两行代码在这里 */
		if ( detail && !detail.avatars ) {
			throw ErrorMsg.UNKNOWN;
		}
		
		if ( isUpdate ) {
			/* 组装新旧头像 */
			oldAvatars = oldAvatars.filter( oa => detail!.avatars.findIndex( na => oa.id === na.id ) === -1 );
			detail.avatars = detail.avatars.concat( oldAvatars );
		}
		await bot.redis.setString( dbKey, JSON.stringify( detail ) );
	}
	return detail
}