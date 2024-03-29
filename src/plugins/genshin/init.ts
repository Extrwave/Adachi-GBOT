import bot from "ROOT";
import * as m from "#genshin/module";
import GenshinConfig from "#genshin/module/config";
import pluginSetting from "#genshin/setting";
import FileManagement from "@modules/file";
import { Renderer } from "@modules/renderer";
import { BOT } from "@modules/bot";
import { PluginSetting, PluginSubSetting, SubInfo } from "@modules/plugin";
import { createServer } from "#genshin/server";
import { getMemberInfo } from "@modules/utils/account";
import { findFreePort } from "@modules/utils";

export let config: GenshinConfig;
export let renderer: Renderer;
export let cookies: m.Cookies;
export const artClass = new m.ArtClass();
export const typeData = new m.TypeData();
export const aliasClass = new m.AliasClass();
export const almanacClass = new m.AlmanacClass();
export const wishClass = new m.WishClass();
export const dailyClass = new m.DailyClass();
export const slipClass = new m.SlipClass();
export const privateClass = new m.PrivateClass();
export const characterID = new m.CharacterId();

function loadGenshinConfig( file: FileManagement ): GenshinConfig {
	const initCfg = GenshinConfig.init;
	
	const path: string = file.getFilePath( "genshin.yml" );
	const isExist: boolean = file.isExist( path );
	if ( !isExist ) {
		file.createYAML( "genshin", initCfg );
		return new GenshinConfig( initCfg );
	}
	
	const config: any = file.loadYAML( "genshin" );
	const keysNum = o => Object.keys( o ).length;
	
	/* 检查 defaultConfig 是否更新 */
	if ( keysNum( config ) !== keysNum( initCfg ) ) {
		const c: any = {};
		const keys: string[] = Object.keys( initCfg );
		for ( let k of keys ) {
			c[k] = config[k] ? config[k] : initCfg[k];
		}
		file.writeYAML( "genshin", c );
		return new GenshinConfig( c );
	}
	return new GenshinConfig( config );
}

function loadCookieConfig( file: FileManagement ): m.Cookies {
	const initCfg = m.Cookies.init;
	
	const cPath: string = file.getFilePath( "cookies.yml" );
	const cIsExist: boolean = file.isExist( cPath );
	if ( !cIsExist ) {
		file.createYAML( "cookies", initCfg );
	}
	
	const config: any = file.loadYAML( "cookies" );
	const keysNum = o => Object.keys( o ).length;
	
	/* 检查 defaultConfig 是否更新 */
	if ( keysNum( config ) !== keysNum( initCfg ) ) {
		const c: any = {};
		const keys: string[] = Object.keys( initCfg );
		for ( let k of keys ) {
			c[k] = config[k] ? config[k] : initCfg[k];
		}
		file.writeYAML( "cookies", c );
		return new m.Cookies( c );
	}
	return new m.Cookies( config );
}

/* 删除好友后清除订阅服务 */
async function decreaseFriend( userId: string, { redis }: BOT ) {
	await privateClass.delBatchPrivate( userId );
	await redis.deleteKey( `silvery-star-daily-sub-${ userId }` );
	const info = await getMemberInfo( userId );
	if ( info ) {
		const sendMessage = await bot.message.getSendPrivateFunc( userId, info.guildId );
		await sendMessage( `你的授权服务已被管理员取消` );
	}
}

export async function subs( { redis }: BOT ): Promise<SubInfo[]> {
	const dailySub: string[] = await redis.getKeysByPrefix( "silvery-star-daily-sub-" );
	const dailySubUsers: string[] = dailySub.map( el => {
		return <string>el.split( "-" ).pop();
	} );
	
	return [ {
		name: "授权服务",
		users: privateClass.getUserIDList()
	}, {
		name: "素材订阅",
		users: dailySubUsers
	} ]
}

export async function subInfo(): Promise<PluginSubSetting> {
	return {
		subs: subs,
		reSub: decreaseFriend
	}
}

export async function init( { file, logger }: BOT ): Promise<PluginSetting> {
	/* 加载 genshin.yml cookies.yml 配置 */
	config = loadGenshinConfig( file );
	cookies = loadCookieConfig( file );
	/* 实例化渲染器 */
	const serverPort: number = await findFreePort( config.serverPort, logger );
	renderer = bot.renderer.register(
		"genshin", "/views",
		serverPort, "#app"
	);
	/* 启动 express 服务 */
	createServer( serverPort, logger );
	
	bot.refresh.registerRefreshableFile( "genshin", config );
	bot.refresh.registerRefreshableFile( "cookies", cookies );
	
	return pluginSetting;
}