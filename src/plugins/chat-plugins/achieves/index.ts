import { InputParameter } from "@modules/command";
import { getHitokoto, getPlayBoy, getWeDog, getEmoji } from "./getsentence";
import { getQingYunKeRes } from "./qingyunke";

// 不可 default 导出，函数名固定
export async function main( i: InputParameter ): Promise<void> {
	
	//处理传入的数据
	const mesg: string = i.messageData.msg.content;
	//如果是@指令，去除@的前缀
	var atbot = /\[.+]/;
	var msg: string = "";
	if ( atbot.test( mesg ) ) {
		msg = mesg.replace( atbot, "" ).trim();
	} else {
		msg = mesg;
	}
	//开始匹配回答
	if ( msg.length <= 0 ) {
		//随即回复一个表情包
		await i.sendMessage( { content: "找我有和贵干？", image: getEmoji() } );
	} else {
		var message = "";
		switch ( true ) {
			case /渣男/.test( msg ):
				message = await getPlayBoy( "M" );
				break;
			case /渣女/.test( msg ):
				message = await getPlayBoy( "F" );
				break;
			case /emo/.test( msg ):
				message = await getHitokoto();
				break;
			case /舔狗/.test( msg ):
				message = await getWeDog();
				break;
			case /教程/.test( msg ):
				message = "主页：https://blog.ethreal.cn/home\n" +
					"cookie获取: https://blog.ethreal.cn/archives/hdmyscookies\n" +
					"token获取: https://blog.ethreal.cn/archives/yysgettoken";
				break;
			default:
				//调用青云客免费API
				message = await getQingYunKeRes( msg );
				break;
		}
		await i.sendMessage( message );
	}
	return;
}