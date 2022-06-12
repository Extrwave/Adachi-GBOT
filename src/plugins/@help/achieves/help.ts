import bot from "ROOT";
import Sendable from "@modules/message";
import { InputParameter, Order } from "@modules/command";
import Command from "@modules/command/main";
import FileManagement from "@modules/file";
import { filterUserUsableCommand } from "../utils/filter";
import { readFileSync } from "fs";
import { resolve } from "path"


function getVersion( file: FileManagement ): string {
    const path: string = file.getFilePath("package.json", "root");
    const { version } = require(path);
    return version.split("-")[ 0 ];
}

function messageStyle( title: string, list: string[], command: Command ): Sendable | string {
    const DETAIL = <Order>command.getSingle("adachi.detail");
    list.push("", `使用 ${ DETAIL.getHeaders()[ 0 ] }+序号 获取提示`,);
    list.push("[ ] 必填, ( ) 选填, | 选择");
    return [ title, ...list ].join("\n");
}

//
// async function forwardStyle(
//     title: string, list: string[],
//     { config, client, command }: InputParameter
// ): Promise<Sendable> {
//     const content: FakeMessage[] = [];
//
//     const DETAIL = <Order>command.getSingle("adachi.detail");
//     list.push(`使用 ${ DETAIL.getHeaders()[ 0 ] }+序号 获取提示`);
//     list.push("[ ] 必填, ( ) 选填, | 选择");
//     list.forEach(el => content.push({
//         user_id: config.appID,
//         nickname: "BOT",
//         message: {
//             type: "text",
//             data: { text: el }
//         }
//     }));

// const reply = await client.makeForwardMsg(content);
// if ( reply.status === "ok" ) {
//     const content: string = reply.data.data.data;
//     reply.data.data.data = content.replace("[聊天记录]", "[Adachi-BOT 帮助信息]")
//         .replace("转发的聊天记录", title)
//         .replace(/查看\d+条转发消息/, "点击查看提示");
//     return reply.data;
// }
// return "";
// }
//
// function xmlStyle( title: string, list: string[], command: Command ): Sendable {
//     const xmlHead: string = "[CQ:xml,data=" +
//         '<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>' +
//         '<msg serviceID="1" templateID="0" action="web" brief="&#91;Adachi-BOT 帮助信息&#93;" sourceMsgId="0" url="" flag="2" adverSign="0" multiMsgFlag="0">' +
//         '<item layout="0" advertiser_id="0" aid="0" />' +
//         '<item layout="6" advertiser_id="0" aid="0">' +
//         `<title size="30" maxLines="2" lineSpace="36">${ title }</title>` +
//         '<summary size="24">';
//
//     const xmlBody: string = list.map(el => {
//         return el.replace(/\[/g, "&#91;")
//             .replace(/]/g, "&#93;");
//     }).join("\n");
//
//     const DETAIL = <Order>command.getSingle("adachi.detail");
//     const xmlFoot: string = "</summary>" +
//         '<hr hidden="false" style="0" />' +
//         '<summary size="26">' +
//         `使用 ${ DETAIL.getHeaders()[ 0 ] }+序号 获取更多信息\n` +
//         "&#91; &#93; 必填&#44; ( ) 选填&#44; | 选择" +
//         "</summary>" +
//         "</item>" +
//         '<source name="" icon="" action="" appid="-1" />' +
//         "</msg>" +
//         ",type=1]";
//
//     return xmlHead + xmlBody + xmlFoot;
// }

async function getHelpMessage(
    title: string, list: string[],
    i: InputParameter
): Promise<Sendable | string> {
    switch ( i.config.helpMessageStyle ) {
        case "message":
            return messageStyle(title, list, i.command);
        // case "forward":
        //     return await forwardStyle(title, list, i);
        // case "xml":
        //     return xmlStyle(title, list, i.command);
        default:
            return "";
    }
}

export async function main( i: InputParameter ): Promise<void> {

    const type = i.messageData.msg.direct_message ? "private" : "group";  //消息类型
    const masterID = bot.config.master; //BOT主人
    const userId = i.messageData.msg.author.id; //发送者UID

    if ( type === "private" && userId === masterID ) {
        const title: string = `打工七 v${ getVersion(i.file) }`;
        const commands = await filterUserUsableCommand(i);
        if ( commands.length === 0 ) {
            await i.sendMessage("没有可用的指令");
            return;
        }

        let ID: number = 0;
        if ( i.messageData.msg.content === "-k" ) {
            const keys: string = commands.reduce(( pre, cur ) => {
                return pre + `\n${ ++ID }. ${ cur.getCmdKey() }`;
            }, "");
            await i.sendMessage(title + keys);
        } else {
            const msgList: string[] = commands.map(el => `${ ++ID }. ${ el.getDesc() }`);
            // await i.sendMessage(await getHelpMessage(title, msgList, i), false);
        }
    } else {
        const imageDir = resolve(__dirname, "../image/help.png");
        const base64 = readFileSync(imageDir).toString("base64")
        const image = `[CQ:image,file=base64://${ base64 }]`;
        await i.sendMessage(image);
    }
}