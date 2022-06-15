import request from "#genshin/utils/requests";

const HEADERS = {
	"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36 Edg/99.0.1150.46",
};

var APIS = [
	"https://v1.hitokoto.cn?encode=text&&c=j", //一言骚话
	"https://api.lovelive.tools/api/SweetNothings/Serialization/Text", //渣男渣女情话
	"https://api.lo-li.icu/wyy/", //网抑云句子
	"https://api.dzzui.com/api/tiangou?format=json", //舔狗日记
];

export interface MSG {
    code: number;
    time: string;
	text: string;
};


//获取一言网站的一句话，具体详情 https://developer.hitokoto.cn/sentence/
export async function getHitokoto(): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: APIS[2],
			headers: {
				...HEADERS,
			}
		} )
			.then( ( result ) => {
				resolve( result );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

//获取一句情话，具体参见 https://lovelive.tools/
export async function getPlayBoy( type: string ): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: `${ APIS[1] }?genderType=${ type }`,
			headers: {
				...HEADERS,
			}
		} )
			.then( ( result ) => {
				resolve( result );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

//获取一段舔狗日记
//获取一句情话，具体参见 https://lovelive.tools/
export async function getWeDog(): Promise<string> {
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: APIS[3],
			headers: {
				...HEADERS,
			}
		} )
			.then( ( result ) => {
				const msg :MSG = JSON.parse(result);
				resolve( msg.text );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

//获取随机表情包
export function getEmoji(): string {
	//当指令后没有跟数据，随机返回此数组里面的一句话
	var text = ["[CQ:image,file=c4d4506256984e0951ae70ef2d39c7af43207-300-435.gif,url=https://c2cpicdw.qpic.cn/offpic_new/1678800780//1678800780-2229448361-C4D4506256984E0951AE70EF2D39C7AF/0?term=2]",
		"[CQ:image,file=4e83609698bc1753845aa0be8d66051d239776-360-360.gif,url=https://c2cpicdw.qpic.cn/offpic_new/1678800780//1678800780-4170714532-4E83609698BC1753845AA0BE8D66051D/0?term=2]",
		"[CQ:image,file=e9bd0789f60b2045ecba19e36dd25ec71068961-360-202.gif,url=https://c2cpicdw.qpic.cn/offpic_new/1678800780//1678800780-3888586142-E9BD0789F60B2045ECBA19E36DD25EC7/0?term=2]",
		"[CQ:image,file=d757d5240d4b157d098b1719921969a11565-50-50.jpg,url=https://c2cpicdw.qpic.cn/offpic_new/1678800780//1678800780-2518379710-D757D5240D4B157D098B1719921969A1/0?term=2]"
	];
	//Math.random()返回0-1之间随机一个数，确保text数组长度不要为1，可能会报空指针异常
	return text[Math.round( Math.random() * text.length - 1 )];
}

