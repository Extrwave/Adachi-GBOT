import { AuthLevel } from "@modules/management/auth";
import { OrderConfig, SwitchConfig } from "@modules/command";
import { PluginSetting } from "@modules/plugin";

const manager: SwitchConfig = {
	type: "switch",
	mode: "divided",
	cmdKey: "adachi-manager",
	desc: [ "设置/取消管理", "[ID]" ],
	header: "",
	regexp: [ "\\d+" ],
	onKey: "manager",
	offKey: "unmanaged",
	auth: AuthLevel.Master,
	main: "manager"
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
	desc: [ "", "" ],
	headers: [ "refresh" ],
	regexps: [],
	auth: AuthLevel.Master,
	main: "refresh",
	detail: "该指令用于重新加载在 /config 目录中的部分配置文件（setting 不会重新加载）"
}

// const upgrade: OrderConfig = {
//     type: "order",
//     cmdKey: "adachi.hot-upgrade",
//     desc: [ "更新bot", "(-f)" ],
//     headers: [ "upgrade" ],
//     regexps: [ "(-f)?" ],
//     auth: AuthLevel.Master,
//     main: "upgrade",
//     detail: "该指令用于检测并更新 bot 源码\n" +
//         "要求项目必须是通过 git clone 下载的\n" +
//         "若存在更新则会更新并重启 bot\n" +
//         "在指令后追加 -f 来覆盖本地修改强制更新"
// }



export async function init(): Promise<PluginSetting> {
	return {
		pluginName: "@management",
		cfgList: [
			manager, refresh, ban, limit
		]
	}
}