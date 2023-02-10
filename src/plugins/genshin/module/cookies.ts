import bot from "ROOT"
import { cookies } from "#genshin/init";
import { scheduleJob } from "node-schedule";
import { RefreshCatch } from "@modules/management/refresh"
import { refreshPublicCookie } from "#genshin/utils/cookie";

scheduleJob( "0 1 0 * * *", () => refreshPublicCookie() );

export class Cookies {
	private index: number;
	private length: number;
	private cookies: string[];
	
	static checkMysID( cookie: string ): string {
		const reg: RegExp = /.*?tuid=([0-9]+).*?/;
		const execRes: RegExpExecArray | null = reg.exec( cookie );
		return execRes ? execRes[1] : "cookie 格式不正确";
	}
	
	public static init = {
		index: 0,
		cookies: [ "米游社信息公共查询Cookies(允许设置多个)" ]
	}
	
	constructor( config: any ) {
		this.index = config.index;
		this.cookies = config.cookies;
		this.length = this.cookies.length;
	}
	
	public increaseIndex(): void {
		this.index = this.index === this.length - 1 ? 0 : this.index + 1;
		bot.file.writeYAML( "cookies", {
			index: this.index,
			cookies: this.cookies
		} );
	}
	
	public get(): string {
		return this.cookies[this.index];
	}
	
	public getIndex(): number {
		return this.index;
	}
	
	public getCookies(): string[] {
		return this.cookies;
	}
	
	public isAllUsed(): boolean {
		return this.index === 0;
	}
	
	public async refresh( config ): Promise<string> {
		try {
			this.index = config.index;
			this.cookies = config.cookies;
			this.length = this.cookies.length;
			return "cookies 重新加载完毕";
		} catch ( error ) {
			throw <RefreshCatch>{
				log: ( <Error>error ).stack,
				msg: "cookies 重新加载失败，请前往控制台查看日志"
			};
		}
	}
}

