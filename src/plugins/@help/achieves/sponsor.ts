import fs from "fs";
import { v4 } from 'uuid'
import { InputParameter } from "@modules/command";

/**
Author: Ethereal
CreateTime: 2022/7/26
 */

export async function main( i: InputParameter ): Promise<void> {
	
	await i.sendMessage( {
		content: `感谢您的支持 ~ `,
		image: "http://cdn.ethreal.cn/img/1665227901326-1665227902.png"
	} );
	return;
}