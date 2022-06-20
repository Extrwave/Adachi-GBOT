import { InputParameter } from "@modules/command";

// 不可 default 导出，函数名固定
export async function main( { messageData, redis, sendMessage }: InputParameter
): Promise<void> {
	
	const dbKey = "extr-wave-yys-sign-" + messageData.msg.author.id;
	await redis.deleteKey( dbKey );
	await sendMessage( `已取消 [ ${ messageData.msg.author.username } ] 云原神签到服务` );
}