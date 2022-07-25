import { PluginSetting, PluginSubSetting, SubInfo } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { autoSign } from "./achieves/auto_sign";
import { MessageScope } from "@modules/utils/message";
import { BOT } from "@modules/bot";
import { AuthLevel } from "@modules/management/auth";
import { cancelToken } from "#yyscloud/util/user_data";
import { getMemberInfo } from "@modules/utils/account";
import bot from "ROOT";

const signEnable: OrderConfig = {
	type: "order",
	cmdKey: "extr-wave-yysign-enable",
	desc: [ "开启云原神授权", "" ],
	headers: [ "onyys" ],
	regexps: [],
	main: "achieves/enable_sign",
	scope: MessageScope.Private,
};

const signConfirm: OrderConfig = {
	type: "order",
	cmdKey: "extr-wave-yysign-confirm",
	desc: [ "验证云原神授权", "" ],
	headers: [ "yconfirm" ],
	regexps: [ ".+" ],
	main: "achieves/enable_sign",
	scope: MessageScope.Private,
	display: false,
	ignoreCase: false
}

const signDisable: OrderConfig = {
	type: "order",
	cmdKey: "extr-wave-yysign-disable",
	desc: [ "取消云原神授权", "" ],
	headers: [ "offyys" ],
	regexps: [],
	main: "achieves/disable_sign",
	scope: MessageScope.Private,
};

const signRemedy: OrderConfig = {
	type: "order",
	cmdKey: "extr-wave-yysign-remedy",
	desc: [ "云原神全签", "" ],
	headers: [ "allyys" ],
	regexps: [],
	main: "achieves/auto_sign",
	auth: AuthLevel.Manager
}


export async function subs( { redis }: BOT ): Promise<SubInfo[]> {
	const yysSub: string[] = await redis.getKeysByPrefix( "extr-wave-yys-sign-" );
	const yysSubUsers: string[] = yysSub.map( el => {
		return <string>el.split( "-" ).pop();
	} );
	
	return [ {
		name: "云原神签到",
		users: yysSubUsers
	} ]
}

export async function subInfo(): Promise<PluginSubSetting> {
	return {
		subs: subs,
		reSub: exitGuildClean
	}
}

/* 取消他人云原神签到服务方法 */
async function exitGuildClean( userId: string ) {
	await cancelToken( userId );
	const info = await getMemberInfo( userId );
	if ( info ) {
		const sendMessage = await bot.message.getSendPrivateFunc( info.guildID, userId );
		await sendMessage( `你的云原神签到配置已被管理员取消` );
	}
}


// 不可 default 导出，函数名固定
export async function init(): Promise<PluginSetting> {
	await autoSign();
	return {
		pluginName: "yyscloud",
		cfgList: [ signEnable, signConfirm, signDisable, signRemedy ]
	};
}