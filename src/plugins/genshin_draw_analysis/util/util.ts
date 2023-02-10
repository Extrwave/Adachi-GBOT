import { randomString } from "#genshin/utils/random";
import FileManagement from "@modules/file";
import { Md5 } from "md5-typescript";
import { FakeIdFunc, QiniuOssConfig } from "#genshin_draw_analysis/util/types";
import Database from "@modules/redis";

function getRandomNum( Min, Max ) {
	let Range = Max - Min;
	let Rand = Math.random();
	return Min + Math.round( Rand * Range );
}

async function sleep( ms: number ): Promise<void> {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

function parseID( msg: string ): number {
	if ( !msg ) {
		return 1;
	}
	const id: number = parseInt( msg );
	if ( !Number.isNaN( id ) ) {
		return id;
	}
	
	const res: string[] | null = msg.match( /(\d+)/g );
	if ( res ) {
		const list: string[] = res.sort( ( x, y ) => x.length - y.length );
		return parseInt( list[0] );
	} else {
		return 1;
	}
}

function generateDS(): string {
	const n: string = "dWCcD2FsOUXEstC5f9xubswZxEeoBOTc";
	const i: number = Date.now() / 1000 | 0;
	const r: string = randomString( 6 ).toLowerCase();
	const c: string = Md5.init( `salt=${ n }&t=${ i }&r=${ r }` );
	
	return `${ i },${ r },${ c }`;
}

function getGameBiz( first: string ): string {
	switch ( first ) {
		case "1":
			return "hk4e_cn";
		case "2":
			return "hk4e_cn";
		case "5":
			return "hk4e_cn";
		default:
			return "hk4e_global";
	}
}

export const fakeIdFn: () => FakeIdFunc = () => {
	let id = 1000000000000000000n;
	return () => {
		id = id + 1n
		return id.toString( 10 );
	}
}

const header_zh_cn = {
	time: '时间',
	name: '名称',
	item_type: '类别',
	rank_type: '星级',
	gacha_type: '祈愿类型'
}

const gacha_types_zh_cn = { "301": "角色活动祈愿", "400": "角色活动祈愿-2", "302": "武器活动祈愿", "200": "常驻祈愿", "100": "新手祈愿" };
const gacha_types_en_us = {
	"301": "Character Event Wish",
	"400": "Character Event Wish-2",
	"302": "Weapon Event Wish",
	"200": "Standard Wish",
	"100": "Beginner's Wish"
};

const sheet_names_zh_cn = { "301": "角色活动祈愿", "302": "武器活动祈愿", "200": "常驻祈愿", "100": "新手祈愿" };
const sheet_names_en_us = {
	"301": "Character Event Wish",
	"302": "Weapon Event Wish",
	"200": "Standard Wish",
	"100": "Beginner's Wish"
};

function get_sheet_name( type: string ): string {
	return sheet_names_zh_cn[type];
}

function convert2Lang( key: string, lang: string ): string {
	return lang === 'zh-cn' ? header_zh_cn[key] : key;
}

function convert2Readable( gacha_type: string, lang: string ): string {
	return lang === 'zh-cn' ? gacha_types_zh_cn[gacha_type] : gacha_types_en_us[gacha_type];
}

const rank_color = {
	"3": "ff8e8e8e",
	"4": "ffa256e1",
	"5": "ffbd6932",
}

function getColor( rank_type: string ): string {
	return rank_color[rank_type];
}

async function upload2Qiniu( file_path: string, file_name: string, qiniu_config: QiniuOssConfig, redis: Database ): Promise<string> {
	const {
		form_up: { FormUploader },
		auth: { digest },
		rs: { PutPolicy }
	} = require( "qiniu" );
	
	// 获取上传凭证
	let upload_token: string = await redis.getString( "genshin_gacha.oss.upload_token" );
	if ( !upload_token ) {
		const mac = new digest.Mac( qiniu_config.accessKey, qiniu_config.secretKey );
		const options = {
			scope: qiniu_config.bucket
		};
		const putPolicy = new PutPolicy( options );
		upload_token = putPolicy.uploadToken( mac );
		await redis.setString( "genshin_gacha.oss.upload_token", upload_token, 3600 );
	}
	
	// 开始上传
	const formUploader = new FormUploader();
	return new Promise( ( resolve, reject ) => {
		formUploader.putFile( upload_token, `${ qiniu_config.folder }/${ file_name }`, file_path, null, ( respErr, respBody, respInfo ) => {
			if ( respErr ) {
				reject( respErr );
				return;
			}
			
			if ( respInfo.statusCode !== 200 ) {
				reject( respBody );
				return;
			}
			
			const { key } = respBody;
			resolve( `${ qiniu_config.domain }${ key }?attname=${ file_name }` );
		} );
	} );
}

export function checkDependencies( file: FileManagement, ...dependencies ): string[] {
	const path: string = file.getFilePath( "package.json", "root" );
	const { dependencies: dep } = require( path );
	// 过滤出未安装的依赖
	const keys: string[] = Object.keys( dep );
	return dependencies.filter( dependency => !keys.includes( dependency ) );
}

export {
	sleep, parseID, generateDS, getGameBiz, getColor,
	upload2Qiniu, convert2Readable, convert2Lang, get_sheet_name
};