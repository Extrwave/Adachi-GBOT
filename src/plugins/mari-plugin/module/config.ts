import { RefreshCatch } from "@modules/management/refresh";
import { configFileName } from "#mari-plugin/init";

export interface IMariPluginConfig {
	tips: string;
	serverPort: number;
	uidQuery: boolean;
	enKaApi: string;
}

export default class MariPluginConfig {
	public serverPort: number;
	public uidQuery: boolean;
	public enKaApi: string;
	
	public static init: IMariPluginConfig = {
		tips: "若 enka 连接异常，可尝试更换 enKaApi 为下面的代理地址\n" +
			"原地址：https://enka.network/\n" +
			"广东节点：https://enka.microgg.cn/\n" +
			"上海节点：https://enka.minigg.cn/\n" +
			"感谢 @MiniGrayGay(Github: https://github.com/MiniGrayGay) 提供的反代服务",
		serverPort: 60721,
		uidQuery: false,
		enKaApi: "https://enka.network/"
	};
	
	constructor( config: IMariPluginConfig ) {
		this.serverPort = config.serverPort;
		this.uidQuery = config.uidQuery;
		this.enKaApi = config.enKaApi;
	}
	
	public async refresh( config: IMariPluginConfig ): Promise<string> {
		try {
			this.uidQuery = config.uidQuery;
			this.enKaApi = config.enKaApi;
			return `${ configFileName }.yml 重新加载完毕`;
		} catch ( error ) {
			throw <RefreshCatch>{
				log: ( <Error>error ).stack,
				msg: `${ configFileName }.yml 重新加载失败，请前往控制台查看日志`
			};
		}
	}
}