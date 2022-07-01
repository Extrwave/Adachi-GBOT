/**
Author: Ethereal
CreateTime: 2022/6/21
 */
import * as msg from "@modules/message";
import { API, getChatResponse, getEmoji, getTextResponse, getWeDog } from "@modules/utils/api";
import { Message } from "@modules/utils/message";

export async function autoReply( messageData: Message, sendMessage: msg.SendFunc ) {
	//处理传入的数据
	const msg: string = messageData.msg.content.trim() || "";
	//开始匹配回答
	if ( msg.length <= 0 ) {
		//随即回复一个表情包
		await sendMessage( { content: "找我有何贵干？", image: getEmoji() } );
	} else {
		let message = "";
		switch ( true ) {
			case /\//.test( msg ):
				message = "请输入正确的指令和参数\n具体用法查阅：/help ";
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