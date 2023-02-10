import fetch from "node-fetch";
import { InputParameter } from "@modules/command";
import { DB_KEY, Gacha_Info, Standard_Gacha } from "#genshin_draw_analysis/util/types";
import { fakeIdFn } from "#genshin_draw_analysis/util/util";
import { gacha_config } from "#genshin_draw_analysis/init";

async function importFromUIGFJson( file_url, { redis, sendMessage }: InputParameter ): Promise<void> {
	const response: Response = await fetch( file_url );
	let rawString = await response.text();
	//将ID转为字符串避免精度丢失
	rawString = rawString.replace( /"id": (\d+)/g, '"id":"$1"' );
	const { info, list }: Standard_Gacha = JSON.parse( rawString );
	if ( list ) {
		const func = fakeIdFn();
		for ( let data of list ) {
			const gacha_id: string = data.id || func();
			const gacha_info: Gacha_Info = {
				...data,
				id: gacha_id,
				lang: info.lang,
				uid: info.uid
			}
			delete gacha_info['uigf_gacha_type'];
			await redis.setHash( `${ DB_KEY.ANALYSIS_DATA }-${ data.uigf_gacha_type }-${ info.uid }`, { [gacha_id]: JSON.stringify( gacha_info ) } );
		}
		await sendMessage( `[ UID${ info.uid } ] 的 ${ list.length } 条抽卡记录数据已导入。` );
	} else {
		await sendMessage( "文件不存在或者不支持的格式\n" +
			`请前往上传: ${ gacha_config.uploadAddr }` );
	}
}

async function importFromUIGFExcel( file_url: string, { redis, sendMessage }: InputParameter ): Promise<void> {
	const response: Response = await fetch( file_url );
	const buffer: ArrayBuffer = await response.arrayBuffer();
	const ExcelJS = require( 'exceljs' );
	const workbook = new ExcelJS.Workbook();
	await workbook.xlsx.load( buffer );
	const worksheet = workbook.getWorksheet( "原始数据" );
	if ( !worksheet ) {
		await sendMessage( "没有在Excel中发现[原始数据]表，无法导入你的数据。" );
		return;
	}
	const sheetValues: any[] = worksheet.getSheetValues();
	const headers: string[] = sheetValues[1];
	const func = fakeIdFn();
	let import_uid: string = "";
	sheetValues.filter( ( v, i ) => i > 1 ).forEach( value => {
		const gacha_info: object = {};
		headers.forEach( ( key, idx ) => {
			if ( key === 'id' && !value[idx] ) {
				gacha_info[key] = func();
			}
			gacha_info[key] = value[idx];
		} )
		// @ts-ignore
		const { uigf_gacha_type, uid, id } = gacha_info;
		delete gacha_info['uigf_gacha_type'];
		import_uid = uid;
		redis.setHash( `${ DB_KEY.ANALYSIS_DATA }-${ uigf_gacha_type }-${ uid }`, { [id]: JSON.stringify( gacha_info ) } );
	} );
	
	await sendMessage( `[ UID${ import_uid } ] 的 ${ sheetValues.length } 条抽卡记录数据已导入。` );
}

export async function main( bot: InputParameter ): Promise<void> {
	let download_url = gacha_config.downloadAddr;
	const { sendMessage, messageData, client, logger } = bot;
	let content = messageData.msg.content;
	const reg = new RegExp( /(?<fileName>[A-Za-z0-9-]+\.)\s*(?<importType>json|excel$)/ );
	const exec: RegExpExecArray | null = reg.exec( content );
	download_url += content;
	const importType: string | undefined = exec?.groups?.importType;
	try {
		if ( importType === 'json' ) {
			await importFromUIGFJson( download_url, bot );
		} else if ( importType === 'excel' ) {
			// excel
			await importFromUIGFExcel( download_url, bot );
		} else {
			await sendMessage( "不支持的文件格式，仅支持UIGF JSON或者Excel" );
		}
	} catch ( error ) {
		await sendMessage( "文件获取失败，请前往上传\n" +
			gacha_config.uploadAddr );
	}
}