import { OrderConfig } from "@modules/command";
import { PluginSetting } from "@modules/plugin";

const panelDetail: OrderConfig = {
	type: "order",
	cmdKey: "seto-mari-panel",
	desc: [ "面板", "[角色] (@|UID|序号)" ],
	headers: [ "panel" ],
	regexps: [
		[ "[\\u4e00-\\u9fa5]+", "(\\d+)?" ],
		[ "[\\u4e00-\\u9fa5]+", "\\<@!\\d+>?" ],
	],
	main: "achieves/chara/detail",
	detail: "展示看板角色详情，游戏中将角色放入看板并打开\"显示详细信息\"才可查询"
};

const panelUpdate: OrderConfig = {
	type: "order",
	cmdKey: "seto-mari-panel-update",
	desc: [ "更新面板", "(@|UID)(-c)" ],
	headers: [ "panel_update" ],
	regexps: [
		[ "(\\d+)?", "(-c)?" ],
		[ "\\<@!\\d+>?", "(-c)?" ]
	],
	main: "achieves/chara/update",
	detail: "更新并存储面板详情，游戏中将角色放入看板并打开 [ 显示详细信息 ] 才可获取\n" +
		"使用 -c 清空存储的面板数据"
};

export default <PluginSetting>{
	pluginName: "mari-plugin",
	cfgList: [ panelUpdate, panelDetail ],
	repo: {
		owner: "Extrwave",
		repoName: "Adachi-Plugin",
		ref: "mari-plugin"
	}
};