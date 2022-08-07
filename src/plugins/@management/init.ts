import { AuthLevel } from "@modules/management/auth";
import { OrderConfig, SwitchConfig } from "@modules/command";
import { PluginSetting } from "@modules/plugin";
import { MessageScope } from "@modules/utils/message";

const manager: SwitchConfig = {
	type: "switch",
	mode: "divided",
	cmdKey: "adachi-manager",
	desc: [ "设置管理", "[@用户]" ],
	header: "",
	regexp: [ "<@!\\d+>" ],
	onKey: "man",
	offKey: "unman",
	auth: AuthLevel.Master,
	main: "manager",
	detail: "设置成员对BOT的管理权限，非QQ频道管理\n" +
		"后续可能同步实现频道管理（挖坑"
};

const ban: SwitchConfig = {
	type: "switch",
	mode: "divided",
	cmdKey: "adachi-ban",
	desc: [ "封禁用户", "[@用户]" ],
	header: "",
	regexp: [ "<@!\\d+>" ],
	onKey: "ban",
	offKey: "unban",
	auth: AuthLevel.Manager,
	main: "ban",
	detail: "封禁或者解禁某人对BOT的使用权"
};

const limit: SwitchConfig = {
	type: "switch",
	mode: "single",
	cmdKey: "adachi-limit",
	desc: [ "指令权限", "@用户 [key] #{OPT}" ],
	header: "limit",
	onKey: "on",
	offKey: "off",
	regexp: [ "<@!\\d+>", "[.-\\w]+", "#{OPT}" ],
	auth: AuthLevel.Manager,
	main: "limit",
	detail: "封禁或者解禁某人对BOT的具体某一指令使用权"
};

const refresh: OrderConfig = {
	type: "order",
	cmdKey: "adachi-hot-update-config",
	desc: [ "重载配置", "" ],
	headers: [ "refresh" ],
	regexps: [],
	auth: AuthLevel.Master,
	main: "refresh",
	detail: "该指令用于重新加载在 /config 目录中的部分配置文件（setting 不会重新加载）"
}

const announce: OrderConfig = {
	type: "order",
	cmdKey: "adachi-announce",
	desc: [ "发送公告", "" ],
	headers: [ "sanno" ],
	regexps: [ "(.+\\s?)*" ],
	auth: AuthLevel.Master,
	main: "anno",
	detail: "该指令用于全局发送公告"
}

const getAnnounce: OrderConfig = {
	type: "order",
	cmdKey: "adachi-get-announce",
	desc: [ "获取公告", "" ],
	headers: [ "anno" ],
	regexps: [],
	main: "anno",
	detail: "该指令用于获取开发者公告"
}

const callMaster: OrderConfig = {
	type: "order",
	cmdKey: "adachi-call-master",
	desc: [ "给我留言", "" ],
	headers: [ "call" ],
	regexps: [ "(.+\\s?)*" ],
	main: "call",
	detail: "通过BOT与机器人开发者联系 ~ "
}

const replyUser: OrderConfig = {
	type: "order",
	cmdKey: "adachi-reply-user",
	desc: [ "回复留言", "" ],
	headers: [ "user" ],
	regexps: [ "(.+\\s?)*" ],
	main: "call",
	auth: AuthLevel.Master,
	detail: "BOT开发者回复用户消息 ~ "
}

const setUseChannel: SwitchConfig = {
	type: "switch",
	mode: "single",
	cmdKey: "adachi-set-use-channel",
	desc: [ "设置子频道", "#{OPT}" ],
	header: "channel",
	regexp: [ "(#.+)?", "#{OPT}" ],
	onKey: "on",
	offKey: "off",
	auth: AuthLevel.Manager,
	scope: MessageScope.Group,
	main: "channel",
	detail: "设置BOT专属可用子频道，即不会再其他地方响应指令\n" +
		"并在非专属区域做出提示，引导前往专属子频道\n" +
		"on 设置专属子频道 off 取消专属子频道"
}

const cancelUseChannel: OrderConfig = {
	type: "order",
	cmdKey: "adachi-cancel-use-channel",
	desc: [ "取消子频道", "" ],
	headers: [ "uchannel" ],
	regexps: [],
	main: "channel",
	auth: AuthLevel.Manager,
	detail: "该操作会使BOT取消所有专属子频道限制 ~ "
}

export async function init(): Promise<PluginSetting> {
	return {
		pluginName: "@management",
		cfgList: [
			manager, refresh, ban, limit,
			announce, getAnnounce, callMaster,
			replyUser, setUseChannel, cancelUseChannel
		]
	}
}