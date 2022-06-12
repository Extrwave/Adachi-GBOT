import { AuthLevel } from "@modules/management/auth";
import { InputParameter, SwitchMatchResult } from "@modules/command";
import idParser from "#@help/utils/id-parser";
import { MessageType } from "@modules/message";

export async function main(
    { sendMessage, messageData, matchResult, redis, auth }: InputParameter
): Promise<void> {
    const match = <SwitchMatchResult>matchResult;
    const [ msgType, targetID ] = idParser(match.match[ 0 ]);

    /* 封禁 */
    if ( match.isOn() ) {
        const targetAuth: AuthLevel = await auth.get(targetID);
        const mineAuth: AuthLevel = await auth.get(messageData.msg.author.id);
        if ( msgType === MessageType.Group ) {
            await redis.addListElement(`adachi.banned-group`, targetID);
            await sendMessage(`群 ${ targetID } 已被屏蔽，将不触发任何指令`);
            return;
        }
        if ( targetAuth >= mineAuth ) {
            await sendMessage(`你没有封禁用户 ${ targetID } 的权限`);
        } else {
            await redis.setString(`adachi.auth-level-${ targetID }`, AuthLevel.Banned);
            await sendMessage(`用户 ${ targetID } 已被设为封禁用户`);
        }
    }
    /* 解封 */
    else {
        if ( msgType === MessageType.Group ) {
            await redis.delListElement(`adachi.banned-group`, targetID);
            await sendMessage(`群 ${ targetID } 屏蔽已解除`);
        } else {
            await redis.setString(`adachi.auth-level-${ targetID }`, AuthLevel.User);
            await sendMessage(`用户 ${ targetID } 已被解封`);
        }
    }
}