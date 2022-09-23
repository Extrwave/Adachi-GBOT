import * as cmd from "./command";
import { BasicConfig } from "./command";
import { BOT } from "@modules/bot";

declare function require( moduleName: string ): any;

export type SubInfo = {
	name: string;
	users: string[];
};

export type PluginSubSetting = {
	subs: ( bot: BOT ) => Promise<SubInfo[]>;
	reSub: ( userId: string, bot: BOT ) => Promise<void>;
}

export interface PluginSetting {
	pluginName: string;
	cfgList: cmd.ConfigType[];
	repo?: string | {
		owner: string;// 仓库拥有者名称
		repoName: string;// 仓库名称
		ref?: string;// 分支名称
	}; // 设置为非必须兼容低版本插件
}

export const PluginReSubs: Record<string, PluginSubSetting> = {};

export const PluginRawConfigs: Record<string, cmd.ConfigType[]> = {};

export const PluginUpgradeServices: Record<string, string> = {};

// 不支持热更新的插件集合，这些插件不会被提示不支持热更新。
const not_support_upgrade_plugins: string[] = [ "@help", "@management", "genshin" ];


export default class Plugin {
	public static async load( bot: BOT ): Promise<BasicConfig[]> {
		const registerCmd: BasicConfig[] = [];
		const plugins: string[] = bot.file.getDirFiles( "", "plugin" );
		
		/* 从 plugins 文件夹从导入 init.ts 进行插件初始化 */
		for ( let plugin of plugins ) {
			const path: string = bot.file.getFilePath( `${ plugin }/init`, "plugin" );
			const { init, subInfo } = require( path );
			try {
				const { pluginName, cfgList, repo }: PluginSetting = await init( bot );
				if ( subInfo ) {
					const { reSub, subs }: PluginSubSetting = await subInfo( bot );
					PluginReSubs[pluginName] = { reSub, subs };
				}
				const commands = Plugin.parse( bot, cfgList, pluginName );
				PluginRawConfigs[pluginName] = cfgList;
				if ( !not_support_upgrade_plugins.includes( pluginName ) ) {
					if ( repo ) {
						if ( typeof repo === "string" ) {
							PluginUpgradeServices[pluginName] = repo ? `https://api.github.com/repos/${ repo }/commits` : "";
						} else {
							PluginUpgradeServices[pluginName] = repo.ref ? `https://api.github.com/repos/${ repo.owner }/${ repo.repoName }/commits/${ repo.ref }` : `https://api.github.com/repos/${ repo.owner }/${ repo.repoName }/commits`;
						}
					} else {
						PluginUpgradeServices[pluginName] = "";
					}
				}
				registerCmd.push( ...commands );
				bot.logger.info( `[ ${ pluginName } ]插件加载完成` );
			} catch ( error ) {
				bot.logger.error( `插件加载异常: ${ <string>error }` );
			}
		}
		
		return registerCmd;
	}
	
	public static parse(
		bot: BOT,
		cfgList: cmd.ConfigType[],
		pluginName: string
	): cmd.BasicConfig[] {
		const commands: cmd.BasicConfig[] = [];
		const data: Record<string, any> = bot.file.loadYAML( "commands" );
		
		/* 此处删除所有向后兼容代码 */
		cfgList.forEach( config => {
			/* 允许 main 传入函数 */
			if ( config.main instanceof Function ) {
				config.run = config.main;
			} else {
				const main: string = config.main || "index";
				const path: string = bot.file.getFilePath(
					pluginName + "/" + main,
					"plugin"
				);
				config.run = require( path ).main;
			}
			
			const key: string = config.cmdKey;
			const loaded = data[key];
			if ( loaded && !loaded.enable ) {
				return;
			}
			
			/* 读取 commands.yml 配置，创建指令实例  */
			try {
				let command: cmd.BasicConfig;
				switch ( config.type ) {
					case "order":
						if ( loaded ) cmd.Order.read( config, loaded );
						command = new cmd.Order( config, bot.config, pluginName );
						break;
					case "switch":
						if ( loaded ) cmd.Switch.read( config, loaded );
						command = new cmd.Switch( config, bot.config, pluginName );
						break;
					case "enquire":
						if ( loaded ) cmd.Enquire.read( config, loaded );
						command = new cmd.Enquire( config, bot.config, pluginName );
						break;
				}
				data[key] = command.write();
				commands.push( command );
			} catch ( error ) {
				bot.logger.error( <string>error );
			}
		} );
		
		bot.file.writeYAML( "commands", data );
		return commands;
	}
}