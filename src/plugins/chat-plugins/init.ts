import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";

const echo: OrderConfig = {
	type: "order",
	cmdKey: "ethreal-plugins-echo",
	desc: [ "随缘聊天", "[可直接@BOT" ],
	headers: [ "echo" ],
	regexps: [ ".+" ],
	display: false,
	main: "achieves/index"
};

// 不可 default 导出，函数名固定
export async function init(): Promise<PluginSetting> {
	return {
		pluginName: "chat-plugins",
		cfgList: [ echo ]
	};
}