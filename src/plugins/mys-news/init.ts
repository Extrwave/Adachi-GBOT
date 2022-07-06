import { OrderConfig, SwitchConfig } from "@modules/command";
import { PluginSetting } from "@modules/plugin";

/**
Author: Ethereal
CreateTime: 2022/7/6
 */

const getNews: OrderConfig = {
	type: "order",
	cmdKey: "extr-wave-mys-news",
	desc: [ "米社资讯", "( acti | anno )" ],
	headers: [ "news" ],
	regexps: [ "(acti|anno)?" ],
	main: "achieves/news",
	detail: "获取米游社最新两条活动/资讯/公告..."
};
// const Sub: SwitchConfig = {
// 	type: "switch",
// 	mode: "single",
// 	cmdKey: "extr-wave-mys-news-subscribe",
// 	desc: [ "米社资讯订阅", "[ on | off ]" ],
// 	header: "subnew",
// 	onKey: "on",
// 	offKey: "off",
// 	regexp: [ "on|off" ],
// 	main: "achieves/subscribe",
// 	detail: "开启频道或者私聊的米游社资讯订阅"
// };

// 不可 default 导出，函数名固定
export async function init(): Promise<PluginSetting> {
	return {
		pluginName: "mys-news",
		cfgList: [ getNews ]
	};
}