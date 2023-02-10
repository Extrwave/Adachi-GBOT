/**
Author: Ethereal
CreateTime: 2022/6/28
 */

import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";

const cos: OrderConfig = {
	type: "order",
	cmdKey: "extr-wave-coser-image",
	desc: [ "来点图片", "(ani | more)" ],
	headers: [ "cos" ],
	regexps: [ "(more|ani)?" ],
	main: "achieves/image",
	detail: "获取一张老婆图片，参数：\n" +
		"无参数 获取米游社Cos图片\n" +
		"more 获取更多米游社Cos图片缓存" +
		"ani 返回一张动漫图片\n"
}

// 不可 default 导出，函数名固定
export async function init(): Promise<PluginSetting> {
	return {
		pluginName: "coser-image",
		cfgList: [ cos ],
		repo: {
			owner: "Extrwave",
			repoName: "Adachi-Plugin",
			ref: "coser-image"
		}
	};
}