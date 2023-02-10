import bot from "ROOT";
import FileManagement from "@modules/file";
import { RefreshCatch } from "@modules/management/refresh";
import { QiniuOssConfig } from "#genshin_draw_analysis/util/types";
import { checkDependencies } from "#genshin_draw_analysis/util/util";
import { execHandle } from "@modules/utils";

export default class GachaAnalysisConfig {
	public static readonly FILE_NAME: string = "gacha_analysis";
	private static init = {
		tips: "accessKey和secretKey是七牛云的两个密钥AK、SK\n" +
			"bucket是你创建的空间名\n" +
			"domain是你文件访问的域名（带协议头，如：https://sources.demo.com/）\n" +
			"folder是文件上传后的目录，比如:bot/gacha_export\n" +
			"uploadAddr是上传的UIGF抽卡记录链接的地址，注意末尾 / \n" +
			"downloadAddr是下载UIGF文件的地址，分开设置是部分网盘上下行地址有区别\n" +
			"qiniu是导出文件的上传地址，不需要导出功能可以不设置\n" +
			"*Addr是导入抽卡记录的上下载地址，不需要导入功能可以不设置",
		qiniuOss: {
			accessKey: '',
			secretKey: '',
			bucket: '',
			domain: '',
			folder: ""
		},
		uploadAddr: "https://drive.ethreal.cn/Loader/WishRecords/",
		downloadAddr: "https://drive.ethreal.cn/d/Loader/WishRecords/"
	};
	public qiniuOss: QiniuOssConfig;
	public uploadAddr: string;
	public downloadAddr: string;
	
	constructor( config: any ) {
		this.qiniuOss = {
			accessKey: config.qiniuOss.accessKey,
			secretKey: config.qiniuOss.secretKey,
			bucket: config.qiniuOss.bucket,
			domain: config.qiniuOss.domain,
			folder: config.qiniuOss.folder
		}
		this.uploadAddr = config.uploadAddr;
		this.downloadAddr = config.downloadAddr;
	}
	
	public static create( file: FileManagement ): GachaAnalysisConfig {
		const initCfg = this.init;
		
		const path: string = file.getFilePath( `${ this.FILE_NAME }.yml` );
		const isExist: boolean = file.isExist( path );
		if ( !isExist ) {
			file.createYAML( this.FILE_NAME, initCfg );
			return new GachaAnalysisConfig( initCfg );
		}
		
		const config: any = file.loadYAML( this.FILE_NAME );
		const keysNum = o => Object.keys( o ).length;
		
		/* 检查 defaultConfig 是否更新 */
		if ( keysNum( config ) !== keysNum( initCfg ) ) {
			const c: any = {};
			const keys: string[] = Object.keys( initCfg );
			for ( let k of keys ) {
				c[k] = config[k] ? config[k] : initCfg[k];
			}
			file.writeYAML( this.FILE_NAME, c );
			return new GachaAnalysisConfig( c );
		}
		return new GachaAnalysisConfig( config );
	}
	
	public async refresh( config ): Promise<string> {
		try {
			this.qiniuOss = {
				accessKey: config.qiniuOss.accessKey,
				secretKey: config.qiniuOss.secretKey,
				bucket: config.qiniuOss.bucket,
				domain: config.qiniuOss.domain,
				folder: config.qiniuOss.folder
			}
			
			const dependencies: string[] = [];
			dependencies.push( "qiniu" );
			dependencies.push( "qrcode" );
			
			const uninstall_dependencies: string[] = checkDependencies( bot.file, ...dependencies );
			for ( let uni_dep of uninstall_dependencies ) {
				bot.logger.info( `检测到 ${ uni_dep } 依赖尚未安装，将自动安装该依赖...` )
				const stdout = await execHandle( `npm i ${ uni_dep }` );
				bot.logger.info( stdout );
			}
			return "抽卡分析插件配置重新加载完毕";
		} catch ( error ) {
			throw <RefreshCatch>{
				log: ( <Error>error ).stack,
				msg: "抽卡分析插件配置重新加载失败，请前往控制台查看日志"
			};
		}
	}
}