import { InputParameter } from "@modules/command";

/**
Author: Ethereal
CreateTime: 2022/7/26
 */

export async function main( i: InputParameter ): Promise<void> {
	
	const userID = i.messageData.msg.author.id;
	const content = i.messageData.msg.content;
	const qqPay = "http://cdn.ethreal.cn/img/1658803956743-1658803958.png";
	const wechatPay = "http://cdn.ethreal.cn/img/WeChatPay-1654016432.png";
	const aliPay = "http://cdn.ethreal.cn/img/Alipay-1654016352.png";
	const sponsorImage = "http://cdn.ethreal.cn/img/sponsor-1658802365.jpg";
	
	if ( /qq/.test( content ) ) {
		await i.sendMessage( { content: `感谢您的支持 ~ `, image: qqPay } );
	} else if ( /wechat/.test( content ) ) {
		await i.sendMessage( { content: `感谢您的支持 ~ `, image: wechatPay } );
	} else if ( /alipay/.test( content ) ) {
		await i.sendMessage( { content: `感谢您的支持 ~ `, image: aliPay } );
	} else {
		await i.sendMessage( { content: `感谢您的支持 ~ `, image: sponsorImage } );
	}
	return;
}