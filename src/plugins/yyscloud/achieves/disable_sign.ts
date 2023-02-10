import { InputParameter } from "@modules/command";
import { cancelToken } from "#yyscloud/util/user_data";

// 不可 default 导出，函数名固定
export async function main( { messageData, sendMessage }: InputParameter
): Promise<void> {
	
	await cancelToken( messageData.msg.author.id );
	await sendMessage( `已取消 [ ${ messageData.msg.author.username } ] 云原神签到服务` );
}