import { InputParameter, Order } from "@modules/command";
import Command from "@modules/command/main";
import FileManagement from "@modules/file";
import { filterUserUsableCommand } from "../utils/filter";
import { Ark, Embed } from "qq-guild-bot";
import { getArkListMessage, MessageArk } from "@modules/utils/arks";


function getVersion( file: FileManagement ): string {
	const path: string = file.getFilePath( "package.json", "root" );
	const { version } = require( path );
	return version.split( "-" )[0];
}

function messageStyle( title: string, list: string[], command: Command ): Embed | string {
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


async function getHelpMessage(
	title: string, list: string[],
	i: InputParameter
): Promise<void> {
	let style: Embed | Ark | string;
	switch ( i.config.helpMessageStyle ) {
		case "message":
			style = messageStyle( title, list, i.command );
			break;
		case "embed":
			style = embedStyle( title, list, i.command );
			break;
		case "ark":
			style = arkStyle( title, list, i.command );
			break;
		default:
			style = "";
	}
	if ( typeof style === "string" ) {
		await i.sendMessage( style );
	} else if ( i.config.helpMessageStyle === "embed" ) {
		//@ts-ignore
		await i.sendMessage( { embed: style } );
	} else {
		//@ts-ignore
		await i.sendMessage( { ark: style } );
	}
}

export async function main( i: InputParameter ): Promise<void> {
	
	const title: string = `Adachi-GBOT v${ getVersion( i.file ) }\n`;
	const commands = await filterUserUsableCommand( i );
	if ( commands.length === 0 ) {
		await i.sendMessage( "没有可用的指令" );
		return;
	}
	
	if ( i.messageData.msg.content === "-k" ) {
		const keys: string = commands.reduce( ( pre, cur ) => {
			return pre + ` \n ${ cur.getCmdKey() }`;
		}, "" );
		await i.sendMessage( title + keys, false );
	} else {
		const msgList: string[] = commands.map( el => `${ el.getDesc() }` );
		await getHelpMessage( title, msgList, i );
	}
}