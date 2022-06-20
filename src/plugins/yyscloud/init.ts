import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { autoSign } from "./achieves/auto_sign";
import { MessageScope } from "@modules/message";

const signEnable: OrderConfig = {
	type: "order",
	cmdKey: "extr-wave-yysign-enable",
	desc: [ "开启云原神签到", "" ],
	headers: [ "onyys" ],
	regexps: [],
	main: "achieves/enable_sign",
	scope: MessageScope.Private,
};

const signConfirm: OrderConfig = {
	type: "order",
	cmdKey: "extr-wave-yysign-confirm",
	desc: [ "验证云原神Token", "" ],
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
	desc: [ "取消云原神签到", "" ],
	headers: [ "offyys" ],
	regexps: [],
	main: "achieves/disable_sign",
	scope: MessageScope.Private,
};

// 不可 default 导出，函数名固定
export async function init(): Promise<PluginSetting> {
	await autoSign();
	return {
		pluginName: "yyscloud",
		cfgList: [ signEnable, signConfirm, signDisable ]
	};
}