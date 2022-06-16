import { v4 } from 'uuid'
import requests from "#genshin/utils/requests"
import * as qiniu from "qiniu"
import { auth } from "qiniu";
import Mac = auth.digest.Mac;
import BotConfig from "@modules/config";

/* 上传到七牛后保存的文件名,默认使用UUID随机化 */


export default class Qiniuyun {
	readonly cdnUrl: string;
	readonly accessKey: string;
	readonly secretKey: string;
	readonly mac: Mac;
	readonly bucket: string;
	
	constructor( config: BotConfig ) {
		//需要填写你的 Access Key 和 Secret Key ,生成凭证MAC
		this.cdnUrl = config.qiniu.CloudUrl; //图片获取Url
		this.accessKey = config.qiniu.QAccessKey;
		this.secretKey = config.qiniu.QSecretKey;
		this.mac = new qiniu.auth.digest.Mac( this.accessKey, this.secretKey );
		this.bucket = config.qiniu.Bucket; //要上传的空间
	}
	
	
	/* 构建上传策略函数，设置回调的url等 */
	private getUpToken( bucket: string, key: string ) {
		
		const putPolicy = new qiniu.rs.PutPolicy( {
			scope: bucket,
			saveKey: key
		} );
		return putPolicy.uploadToken( this.mac );
	}
	
	
	public async upBase64Oss( base64: string ): Promise<{ code: string, data: string }> {
		const key = "adachi/" + v4() + '.png';
		//生成上传 Token
		const token = this.getUpToken( this.bucket, key );
		const header = {
			"Content-Type": "application/octet-stream",
			"Authorization": `UpToken ${ token }`,
		};
		
		/**
		 * 根据对象存储空间修改上传域名
		 * 华东空间使用 upload.qiniup.com
		 * 华北空间使用 upload-z1.qiniup.com
		 * 华南空间使用 upload-z2.qiniup.com
		 * 北美空间使用 upload-na0.qiniup.com
		 */
		let url = "http://upload-z2.qiniup.com/putb64/-1";
		const result = JSON.parse( await requests( {
			method: "POST",
			url: url,
			headers: header,
			body: base64
		} ) );
		if ( result.key ) {
			// console.log( this.cdnUrl + result.key );
			return { code: "ok", data: this.cdnUrl + result.key };
		} else {
			return { code: "error", data: "图片上传OSS失败 ：" + result.error };
		}
	}
}

