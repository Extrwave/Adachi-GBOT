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

// const interval: OrderConfig = {
//     type: "order",
//     cmdKey: "adachi.interval",
//     desc: [ "", "[uqq|g群号] [时间]" ],
//     headers: [ "int" ],
//     regexps: [ "[ugUG]\\d+", "\\d+" ],
//     auth: AuthLevel.Manager,
//     main: "interval",
//     detail: "该命令用于设置群聊/私聊的指令操作触发间隔，时间的单位为毫秒\n" +
//         "1秒=1000毫秒，不支持设置小数"
// };

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

// const restart: OrderConfig = {
//     type: "order",
//     cmdKey: "adachi.restart",
//     desc: [ "重启bot", "" ],
//     headers: [ "restart" ],
//     regexps: [],
//     auth: AuthLevel.Master,
//     main: "restart",
//     detail: "用于重启 bot，win 平台暂时无法使用"
// }

export async function init(): Promise<PluginSetting> {
    return {
        pluginName: "@management",
        cfgList: [
            manager, refresh
        ]
    }
}