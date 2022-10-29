import { URL, URLSearchParams } from "url";
import { RefreshCatch } from "@modules/management/refresh";
import puppeteer from "puppeteer";
import bot from "ROOT";
import * as fs from "fs"
import { Buffer } from "buffer";
import { v4 } from 'uuid'

interface RenderSuccess {
	code: "ok";
	data: fs.ReadStream
}

interface RenderOther {
	code: "other";
	data: string;
}

interface RenderError {
	code: "error";
	data: string;
}


export interface PageFunction {
	( page: puppeteer.Page ): Promise<Buffer | string | void>
}

export type RenderResult = RenderSuccess | RenderOther | RenderError;

export class Renderer {
	private readonly httpBase: string;
	
	constructor(
		private readonly sourceName: string,
		private readonly defaultSelector: string,
		route: string, port: number
	) {
		this.httpBase = `http://localhost:${ port }${ route }`;
	}
	
	private getURL( route: string, params?: Record<string, any> ): string {
		const paramStr: string = new URLSearchParams( params ).toString();
		
		try {
			new URL( route );
			return `${ route }?${ paramStr }`;
		} catch ( e ) {
			const url: string = this.httpBase + route;
			return `${ url }?${ paramStr }`;
		}
	}
	
	public async asBase64(
		route: string,
		params: Record<string, any> = {},
		viewPort: puppeteer.Viewport | null = null,
		selector: string = this.defaultSelector
	): Promise<RenderResult> {
		try {
			const url: string = this.getURL( route, params );
			const base64 = await bot.renderer.screenshot( url, viewPort, selector, { encoding: 'base64' } );
			return { code: "other", data: base64 };
		} catch ( error ) {
			const err = <string>( <Error>error ).stack;
			return { code: "other", data: err };
		}
	}
	
	public async asLocalImage(
		route: string,
		params: Record<string, any> = {},
		viewPort: puppeteer.Viewport | null = null,
		selector: string = this.defaultSelector
	): Promise<RenderResult> {
		return new Promise( async ( resolve, reject ) => {
			try {
				const fileName = bot.file.getFilePath( `${ v4() }.jpeg`, "data" );
				const url: string = this.getURL( route, params );
				await bot.renderer.screenshot( url, viewPort, selector, {
					path: fileName,
					type: 'jpeg'
				} );
				const imageStream = fs.createReadStream( fileName );
				resolve( { code: "ok", data: imageStream } );
				setTimeout( () => {
					fs.rmSync( fileName );
				}, 10000 );
			} catch ( error ) {
				const err = <Error>error;
				bot.logger.error( `图片渲染异常：` + err.stack );
				resolve( { code: "error", data: `图片渲染异常，请联系开发者进行反馈` } );
			}
		} )
	}
	
	public async asForFunction(
		route: string,
		pageFunction: PageFunction,
		viewPort: puppeteer.Viewport | null = null,
		params: Record<string, any> = {}
	): Promise<RenderResult> {
		try {
			const url: string = this.getURL( route, params );
			const data: string = await bot.renderer.screenshotForFunction( url, viewPort, pageFunction );
			return { code: "other", data };
		} catch ( error ) {
			const err = <string>( <Error>error ).stack;
			return { code: "error", data: err };
		}
	}
}

export class BasicRenderer {
	private browser?: puppeteer.Browser;
	private screenshotCount: number = 0;
	
	static screenshotLimit = <const>88;
	
	constructor() {
		this.launchBrowser()
			.then( browser => this.browser = browser );
	}
	
	public register(
		name: string, route: string,
		port: number, defaultSelector: string
	): Renderer {
		return new Renderer( name, defaultSelector, route, port );
	}
	
	public async closeBrowser(): Promise<void> {
		if ( !this.browser ) {
			return;
		}
		const pages = await this.browser.pages();
		await Promise.all( pages.map( page => page.close() ) );
		await this.browser.close();
		this.browser = undefined;
	}
	
	public async launchBrowser(): Promise<puppeteer.Browser> {
		return new Promise( async ( resolve, reject ) => {
			if ( this.browser ) {
				reject( "浏览器已经启动" );
			}
			try {
				const browser = await puppeteer.launch( {
					headless: true,
					args: [
						"--no-sandbox",
						"--disable-setuid-sandbox",
						"--disable-dev-shm-usage"
					]
				} );
				bot.logger.debug( "浏览器启动成功" );
				resolve( browser );
			} catch ( error ) {
				const err: string = `浏览器启动失败: ${ ( <Error>error ).stack }`;
				bot.logger.error( err );
			}
		} );
	}
	
	public async restartBrowser(): Promise<void> {
		await this.closeBrowser();
		this.browser = await this.launchBrowser();
		this.screenshotCount = 0;
	}
	
	public async refresh(): Promise<string> {
		try {
			await this.restartBrowser();
			return `浏览器重启完成`;
		} catch ( error ) {
			throw <RefreshCatch>{
				log: ( <Error>error ).stack,
				msg: `浏览器重启失败，请前往控制台查看日志`
			};
		}
	}
	
	private async pageLoaded( page: puppeteer.Page ) {
		await page.waitForFunction( () => {
			return document.readyState === "complete";
		}, { timeout: 10000 } )
	}
	
	public async screenshot( url: string, viewPort: puppeteer.Viewport | null, selector: string, option?: puppeteer.ScreenshotOptions ): Promise<string> {
		if ( !this.browser ) {
			throw new Error( "浏览器未启动" );
		}
		const page: puppeteer.Page = await this.browser.newPage();
		try {
			// 设置设备参数
			if ( viewPort ) {
				await page.setViewport( viewPort );
			}
			await page.goto( url );
			await this.pageLoaded( page );
			
			const element = await page.$( selector );
			const result = <string>await element?.screenshot( option ? option : {
				encoding: 'base64'
			} );
			await page.close();
			
			this.screenshotCount++;
			if ( this.screenshotCount >= BasicRenderer.screenshotLimit ) {
				await bot.renderer.restartBrowser();
			}
			
			return result;
		} catch ( err: any ) {
			await page.close();
			throw err;
		}
	}
	
	public async screenshotForFunction( url: string, viewPort: puppeteer.Viewport | null, pageFunction: PageFunction ): Promise<string> {
		if ( !this.browser ) {
			throw new Error( "浏览器未启动" );
		}
		const page: puppeteer.Page = await this.browser.newPage();
		try {
			// 设置设备参数
			if ( viewPort ) {
				await page.setViewport( viewPort );
			}
			await page.goto( url );
			await this.pageLoaded( page );
			
			const result = await pageFunction( page );
			await page.close();
			
			this.screenshotCount++;
			if ( this.screenshotCount >= BasicRenderer.screenshotLimit ) {
				await bot.renderer.restartBrowser();
			}
			
			return result === undefined ? "" : result.toString();
		} catch ( err: any ) {
			await page.close();
			throw err;
		}
	}
}