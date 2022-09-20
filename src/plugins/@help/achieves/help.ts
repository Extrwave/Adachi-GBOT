import { BasicConfig, InputParameter, Order } from "@modules/command";
import Command from "@modules/command/main";
import FileManagement from "@modules/file";
import { filterUserUsableCommand } from "../utils/filter";
import { Ark, Embed } from "qq-guild-bot";
import { getArkListMessage } from "@modules/utils/arks";
import { RenderResult } from "@modules/renderer";
import { renderer } from "../init";
import bot from "ROOT";
import * as fs from "fs";
import { MessageScope } from "@modules/utils/message";
import { AuthLevel } from "@modules/management/auth";


interface HelpCommand {
	id: number;
	header: string;
	body: string
	cmdKey: string;
	detail: string;
	pluginName: string;
}


function getVersion( file: FileManagement ): string {
	const path: string = file.getFilePath( "package.json", "root" );
	const { version } = require( path );
	return version.split( "-" )[0];
}

function messageStyle( title: string, list: string[], command: Command ): string {
	const DETAIL = <Order>command.getSingle( "adachi-detail" );
	list.push( "", `使用 ${ DETAIL.getHeaders()[0] }+序号 获取提示`, );
	list.push( "[ ] 必填, ( ) 选填, | 选择" );
	list.push( "授权相关指令仅在私聊中生效" );
	return [ title, ...list ].join( "\n" );
}


function embedStyle( title: string, list: string[], command: Command ): Embed {
	const DETAIL = <Order>command.getSingle( "adachi-detail" );
	list.push( "", `使用 ${ DETAIL.getHeaders()[0] }+序号 获取提示`, );
	list.push( "[ ] 必填, ( ) 选填, | 选择" );
	list.push( "授权相关指令仅在私聊中生效" );
	let embedMsg: Embed = {
		title: title,
		description: "这是一份BOT帮助",
		fields: []
	};
	for ( let item of list ) {
		embedMsg.fields?.push( { name: item } );
	}
	return embedMsg;
}


function arkStyle( title: string, list: string[], command: Command ): Ark {
	const DETAIL = <Order>command.getSingle( "adachi-detail" );
	list.push( "===============================" );
	list.push( `\n使用 ${ DETAIL.getHeaders()[0] }+序号 获取提示` );
	list.push( "[ ] 必填, ( ) 选填, | 选择" );
	list.push( "授权相关指令仅在私聊中生效" );
	let arkHelpMsg: Ark = getArkListMessage( title, "BOT 使用帮助", list );
	return <Ark>arkHelpMsg;
}

/* 使用图片帮助 */
async function cardStyle( i: InputParameter, commands: BasicConfig[], version: string ): Promise<RenderResult> {
	const dbKey = "adachi.help-data";
	const cmdList: HelpCommand[] = commands.map( ( cmd, cKey ) => {
		return {
			id: cKey + 1,
			header: cmd.desc[0],
			body: cmd.getFollow(),
			cmdKey: cmd.cmdKey,
			detail: cmd.detail,
			pluginName: cmd.pluginName
		};
	} );
	
	const cmdData: Record<string, HelpCommand[]> = {};
	for ( const cmd of cmdList ) {
		cmdData[cmd.pluginName] = cmdData[cmd.pluginName] ? [ ...cmdData[cmd.pluginName], cmd ] : [ cmd ];
	}
	
	const DETAIL = <Order>i.command.getSingle( "adachi.detail" );
	
	await i.redis.setString( dbKey, JSON.stringify( {
		detailCmd: DETAIL ? DETAIL.getHeaders()[0] : "",
		version: version,
		commands: cmdData
	} ) );
	
	const res: RenderResult = await renderer.asLocalImage(
		"/index.html" );
	return res;
}


async function getHelpMessage(
	title: string, version: string,
	commands: BasicConfig[], list: string[],
	i: InputParameter
): Promise<void> {
	let style;
	switch ( i.config.helpMessageStyle ) {
		case "message":
			style = messageStyle( title, list, i.command );
			await i.sendMessage( style );
			break;
		case "embed":
			style = embedStyle( title, list, i.command );
			await i.sendMessage( { embed: style } );
			break;
		case "ark":
			style = arkStyle( title, list, i.command );
			await i.sendMessage( { ark: style } );
			break;
		default:
			i.logger.error( "helpMessageStyle设置错误" )
	}
}

export async function main( i: InputParameter ): Promise<void> {
	
	const version = getVersion( i.file );
	const showKeys = i.messageData.msg.content === "-k";
	const commands = await filterUserUsableCommand( i );
	if ( commands.length === 0 ) {
		await i.sendMessage( "没有可用的指令" );
		return;
	}
	
	/* 使用图片帮助,默认获取全部指令 */
	const dbKey = `adachi-help-image`;
	if ( i.config.helpMessageStyle === "card" ) {
		// const helpCard = await i.redis.getString( dbKey );
		// if ( helpCard !== "" ) {
		// 	await i.sendMessage( { file_image: helpCard } );
		// 	return;
		// }
		const allCommands: BasicConfig[] = i.command
			.get( AuthLevel.Master, MessageScope.Private )
			.filter( el => el.display );
		const res = await cardStyle( i, allCommands, version );
		if ( res.code === "ok" ) {
			await i.sendMessage( { file_image: res.data } );
			// await i.redis.setString( dbKey, res.data );
			return;
		} else if ( res.code === "other" ) {
			await i.sendMessage( { image: res.data } );
			return;
		} else {
			await i.sendMessage( res.data );
			return;
		}
	}
	
	const title: string = `Adachi-GBOT v${ version }~`;
	let ID: number = 0;
	if ( showKeys ) {
		const keys: string = commands.reduce( ( pre, cur ) => {
			return pre + `\n${ ++ID }. ${ cur.getCmdKey() }`;
		}, "" );
		await i.sendMessage( title + keys );
	} else {
		const msgList: string[] = commands.map( el => `${ ++ID }. ${ el.getDesc() }` );
		await getHelpMessage( title, version, commands, msgList, i );
	}
}