/**
Author: Ethereal
CreateTime: 2022/6/29
 */
import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";

const chatMaster: OrderConfig = {
	type: "order",
	cmdKey: "adachi-chat-call",
	desc: [ "联系BOT主人", "" ],
	headers: [ "call" ],
	regexps: [ ".+" ],
	main: "achieves/chatMaster",
	detail: "通过BOT与机器人持有者联系 ~ "
}

const replyUser: OrderConfig = {
	type: "order",
	cmdKey: "adachi-reply-user",
	desc: [ "回复用户", "" ],
	headers: [ "user" ],
	regexps: [ ".+\\s.+" ],
	main: "achieves/replyUser",
	auth: AuthLevel.Master,
	detail: "BOT持有者回复用户消息 ~ "
}

// 不可 default 导出，函数名固定
export async function init(): Promise<PluginSetting> {
	return {
		pluginName: "chat-master",
		cfgList: [ chatMaster, replyUser ]
	};
}