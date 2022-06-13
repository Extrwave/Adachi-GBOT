import { InputParameter } from "@modules/command";
import { savaUserData, checkToken } from "../util/user_data";

// 不可 default 导出，函数名固定
export async function main( i: InputParameter ): Promise<void> {
	
	const dbKey = "extr-wave-yys-sign." + i.messageData.msg.author.id;
	if ( await i.redis.existHashKey( dbKey, "token" ) ) {
		await i.sendMessage( "已授权云原神，本次更新token" );
	}
	const token = i.messageData.msg.content;
	await savaUserData( token, i );
	
	//检查token有效性
	const bool = await checkToken( i.messageData.msg.author.id );
	if ( !bool ) {
		await i.sendMessage( "云原神Token无效，请重新获取~" );
	}
	await i.sendMessage( `已开启 [ ${ i.messageData.msg.author.username } ] 云原神签到服务` );
}

