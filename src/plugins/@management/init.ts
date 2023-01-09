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
	scope: MessageScope.Guild,
	auth: AuthLevel.GuildOwner,
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
	scope: MessageScope.Guild,
	auth: AuthLevel.GuildManager,
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
	regexp: [ "<@!\\d+>?", "[-\\w]+", "#{OPT}" ],
	scope: MessageScope.Guild,
	auth: AuthLevel.GuildManager,
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

const callMaster: OrderConfig = {
	type: "order",
	cmdKey: "adachi-leave-message-call",
	desc: [ "给我留言", "" ],
	headers: [ "call" ],
	regexps: [ "(.+\\s?)*" ],
	main: "call",
	detail: "通过BOT与机器人开发者联系 ~ "
}

const replyUser: OrderConfig = {
	type: "order",
	cmdKey: "adachi-leave-message-reply",
	desc: [ "回复留言", "" ],
	headers: [ "reply" ],
	regexps: [ "(.+\\s?)*" ],
	main: "call",
	auth: AuthLevel.Master,
	detail: "BOT开发者回复用户消息 ~ "
}

const setUseChannel: SwitchConfig = {
	type: "switch",
	mode: "single",
	cmdKey: "adachi-set-use-channel",
	desc: [ "设置子频道", "(#子频道) #{OPT}" ],
	header: "channel",
	regexp: [ "(#.+)?", "#{OPT}" ],
	onKey: "on",
	offKey: "off",
	auth: AuthLevel.GuildOwner,
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
	auth: AuthLevel.GuildOwner,
	detail: "该操作会使BOT取消所有专属子频道限制 ~ "
}

const upgrade: OrderConfig = {
	type: "order",
	cmdKey: "adachi-hot-update",
	desc: [ "更新bot", "(-f)" ],
	headers: [ "update" ],
	regexps: [ "(-f)?" ],
	auth: AuthLevel.Master,
	main: "update",
	detail: "该指令用于检测并更新 bot 源码\n" +
		"要求项目必须是通过 git clone 下载的且不能为 win-start 启动\n" +
		"若存在更新则会更新并重启 bot\n" +
		"在指令后追加 -f 来覆盖本地修改强制更新"
}

const upgrade_plugins: OrderConfig = {
	type: "order",
	cmdKey: "adachi-hot-update-plugins",
	desc: [ "更新插件", "(-f) (插件名)" ],
	headers: [ "updatep" ],
	regexps: [ "(-f)?", "([\u4E00-\u9FA5\\w\\-]+)?" ],
	auth: AuthLevel.Master,
	main: "update-plugins",
	detail: "该指令用于检测并更新 bot plugin 源码\n" +
		"要求项目必须是通过 git clone 下载的且不能为 win-start 启动\n" +
		"若存在更新则会更新插件并重启 bot\n" +
		"在指令后追加 -f 来覆盖本地修改强制更新\n" +
		"不指定插件名将更新全部支持热更新的插件"
}

const restart: OrderConfig = {
	type: "order",
	cmdKey: "adachi-restart",
	desc: [ "重启BOT", "" ],
	headers: [ "restart" ],
	regexps: [],
	auth: AuthLevel.Master,
	main: "restart",
	detail: "用于重启 bot，使用win-start方式启动服务无法使用该指令"
}

export async function init(): Promise<PluginSetting> {
	return {
		pluginName: "@management",
		cfgList: [
			manager, refresh, ban, limit,
			announce, callMaster,
			replyUser, setUseChannel, cancelUseChannel,
			upgrade, upgrade_plugins, restart
		]
	}
}