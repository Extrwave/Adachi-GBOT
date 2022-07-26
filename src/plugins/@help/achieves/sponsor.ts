import { InputParameter } from "@modules/command";

/**
Author: Ethereal
CreateTime: 2022/7/26
 */

export async function main( i: InputParameter ): Promise<void> {
	
	const content = i.messageData.msg.content;
	const qqPay = "http://cdn.ethreal.cn/img/QqSponsor-1658823605.jpg";
	const wechatPay = "http://cdn.ethreal.cn/img/WechatSponsor-1658823617.jpg";
	const aliPay = "http://cdn.ethreal.cn/img/AliPaySponsor-1658823707.jpg";
	
	if ( /qq/.test( content ) ) {
		await i.sendMessage( { content: `感谢您的支持 ~ `, image: qqPay } );
	} else if ( /zfb/.test( content ) ) {
		await i.sendMessage( { content: `感谢您的支持 ~ `, image: aliPay } );
	} else {
		await i.sendMessage( { content: `感谢您的支持 ~ `, image: wechatPay } );
	}
	return;
}