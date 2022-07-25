/**
Author: Ethereal
CreateTime: 2022/6/21
 */
import bot from "ROOT";
import * as msg from "@modules/message";
import { API, getChatResponse, getEmoji, getTextResponse, getWeDog } from "@modules/utils/api";
import { Message } from "@modules/utils/message";
import { Order } from "@modules/command";
import { AuthLevel } from "@modules/management/auth";

export async function autoReply( messageData: Message, sendMessage: msg.SendFunc ) {
	//处理传入的数据
	const msg: string = messageData.msg.content.trim() || "";
	//开始匹配回答
	if ( msg.length <= 0 ) {
		//随即回复一个表情包
		await sendMessage( { content: "找我有何贵干？", image: getEmoji() } );
	} else {
		let message;
		switch ( true ) {
			case /\//.test( msg ):
				const HELP = <Order>bot.command.getSingle( `adachi-help`, AuthLevel.Master );
				message = "请输入正确的指令和参数\n" +
					"[ ] 必填, ( ) 选填, | 选择\n" +
					`具体用法查阅：${ HELP.getHeaders()[0] } `;
				break;
			case /渣/.test( msg ):
				message = await getTextResponse( API.lovelive );
				break;
			case /emo/.test( msg ):
				message = await getTextResponse( API.hitokoto );
				break;
			case /诗/.test( msg ):
				message = await getTextResponse( API.poetry );
				break;
			case /舔狗/.test( msg ):
				message = await getWeDog();
				break;
			case /教程/.test( msg ):
				message = "主页(教程)：https://blog.ethreal.cn/home\n" +
					"cookie获取: https://blog.ethreal.cn/archives/hdmyscookies\n" +
					"token获取: https://blog.ethreal.cn/archives/yysgettoken";
				break;
			default:
				//调用青云客免费API
				message = await getChatResponse( msg );
				break;
		}
		await sendMessage( message );
	}
	return;
}