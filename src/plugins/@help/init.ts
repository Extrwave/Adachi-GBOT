import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { Renderer } from "@modules/renderer";
import { BOT } from "@modules/bot";
import { createServer } from "#@help/server";
import { MessageScope } from "@modules/utils/message";
import { findFreePort } from "@modules/utils";

const help: OrderConfig = {
	type: "order",
	cmdKey: "adachi-help",
	desc: [ "帮助", "(-k)" ],
	headers: [ "help" ],
	regexps: [ "(-k)?" ],
	main: "achieves/help"
};

const sponsor: OrderConfig = {
	type: "order",
	cmdKey: "adachi-help-sponsor",
	desc: [ "赞助", "" ],
	headers: [ "sponsor" ],
	regexps: [],
	main: "achieves/sponsor",
}

const push: OrderConfig = {
	type: "order",
	cmdKey: "adachi-push-user",
	desc: [ "推送一条消息", "" ],
	headers: [ "push" ],
	regexps: [],
	main: "achieves/push",
	scope: MessageScope.Guild,
	detail: "通过频道推送一条私信给自己，解决超过3条私信问题"
}

export let renderer: Renderer;

export async function init( bot: BOT ): Promise<PluginSetting> {
	/* 未启用卡片帮助时不启动服务 */
	if ( bot.config.helpMessageStyle === "card" ) {
		const serverPort: number = await findFreePort( bot.config.helpPort, bot.logger );
		/* 实例化渲染器 */
		renderer = bot.renderer.register(
			"@help", "/view",
			serverPort, "#app"
		);
		/* 启动 express 服务 */
		createServer( serverPort, bot.logger );
	}
	
	return {
		pluginName: "@help",
		cfgList: [ help, sponsor, push ]
	};
}