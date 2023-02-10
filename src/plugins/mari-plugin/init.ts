import bot from "ROOT";
import * as m from "./module";
import pluginSetting from "./setting";
import { PluginSetting } from "@modules/plugin";
import { createServer } from "./server";
import { BOT } from "@modules/bot";
import MariPluginConfig from "./module/config";
import FileManagement from "@modules/file";
import { Renderer } from "@modules/renderer";
import { findFreePort } from "@modules/utils";

export let config: MariPluginConfig
export let renderer: Renderer;
export const artifactId = new m.ArtifactId();
export const enKaClass = new m.EnKaClass();
export const characterId = new m.CharacterId();
export const attrIcon = new m.AttrIcon();

export const configFileName = "mari_plugin"

function loadConfig( file: FileManagement ): MariPluginConfig {
	const initCfg = MariPluginConfig.init;
	
	const path: string = file.getFilePath( `${ configFileName }.yml` );
	const isExist: boolean = file.isExist( path );
	if ( !isExist ) {
		file.createYAML( configFileName, initCfg );
		return new MariPluginConfig( initCfg );
	}
	
	const config: any = file.loadYAML( configFileName );
	const keysNum = o => Object.keys( o ).length;
	
	/* 检查 defaultConfig 是否更新 */
	if ( keysNum( config ) !== keysNum( initCfg ) ) {
		const c: any = {};
		const keys: string[] = Object.keys( initCfg );
		for ( let k of keys ) {
			c[k] = config[k] ? config[k] : initCfg[k];
		}
		file.writeYAML( configFileName, c );
		return new MariPluginConfig( c );
	}
	return new MariPluginConfig( config );
}

export async function init( { file, logger }: BOT ): Promise<PluginSetting> {
	/* 加载 mari-plugin.yml 配置 */
	config = loadConfig( file );
	/* 实例化渲染器 */
	const port: number = await findFreePort( config.serverPort, logger );
	renderer = bot.renderer.register(
		"mari-plugin", "/views",
		port, "#app"
	);
	/* 启动 express 服务 */
	createServer( config, logger );
	
	bot.refresh.registerRefreshableFile( configFileName, config );
	
	return pluginSetting;
}