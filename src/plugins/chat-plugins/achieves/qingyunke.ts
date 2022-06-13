import request from "../util/requests";

let URL: string = `http://api.qingyunke.com/api.php?key=free&appid=0&msg=`;

const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36 Edg/99.0.1150.46",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "keep-alive",
    "Accept": "*/*"
};


export interface MSG {
    result: number;
    content: string;
};

//调用青云客的免费对话API，但是延迟比较高，2s左右，详情http://api.qingyunke.com/
export async function getQingYunKe(text: string): Promise<MSG> {
    return new Promise((resolve, reject) => {
        URL = encodeURI(URL + text);
        request({
            method: "GET",
            url: URL,
            headers: {
                ...HEADERS,
            },
            timeout: 6000
        })
            .then((result) => {
                const date: MSG = JSON.parse(result);
                resolve(date);
            })
            .catch((reason) => {
                reject(reason);
            });
    });
}

export async function getQingYunKeRes(text: string): Promise<string> {
    const msg: MSG = await getQingYunKe(text);
    // console.log("收到回复：" + msg.result + " " + msg.content);
    if (msg.result !== 0) {
        return `接口挂掉啦~~`;
    }
    //API默认的名字是 “菲菲”，你可以改成你喜欢的名字
    //修改可能导致部分返回错误，比如 “菲菲公主” ---> “七七公主”
    var reg = new RegExp('菲菲', "g");
    return msg.content.replace(reg, '七七').trim();
}