import { PluginSetting } from "@modules/plugin";
import { OrderConfig } from "@modules/command";

const echo: OrderConfig = {
    type: "order",
    cmdKey: "ethreal-plugins-echo",
    desc: [ "", "[任意内容]" ],
    headers: [ "echo" ],
    regexps: [ ".+" ],
    main: "achieves/index"
};

// 不可 default 导出，函数名固定
export async function init(): Promise<PluginSetting> {
    return {
        pluginName: "chat-plugins",
        cfgList: [ echo ]
    };
}