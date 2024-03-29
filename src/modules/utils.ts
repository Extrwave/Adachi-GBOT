import { createServer } from "net";
import { Logger } from "log4js";
import { exec } from "child_process";

/**
 * 查找一个可用端口
 * @param port 未指定默认从1024开始查找
 * @param logger
 */
export const findFreePort: ( port?: number, logger?: Logger ) => Promise<number> = async ( port = 1024, logger ) => {
	if ( port > 65535 ) {
		// 如果端口号大于65535要重新从1024开始查找(0~1023都是保留端口)
		port = 1024;
	}
	
	function find( port: number ): Promise<number | Error> {
		return new Promise( ( resolve, reject ) => {
			let server = createServer().listen( port );
			server.on( 'listening', () => {
				server.close();
				resolve( port );
			} );
			server.on( 'error', ( err: any ) => {
				if ( err.code == 'EADDRINUSE' ) {
					const message = `端口[${ port }]已被占用，正在为你寻找下一个可用端口...`;
					if ( !logger ) {
						console.debug( message );
					} else {
						logger.debug( message );
					}
					resolve( err );
				} else {
					reject( err );
				}
			} );
		} );
	}
	
	let result = await find( port );
	if ( result instanceof Error ) {
		port++;
		return await findFreePort( port );
	} else {
		return port;
	}
}

export function randomSecret( length: number ): string {
	const charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ,.;></~?[]{}~!@#$%^&*()-=+1234567890";
	const characterLen: number = charSet.length;
	let result: string = "";
	
	for ( let i = 0; i < length; i++ ) {
		const randNum: number = Math.floor( Math.random() * characterLen );
		result += charSet.charAt( randNum );
	}
	
	return result;
}

/* 命令执行 */
export async function execHandle( command: string ): Promise<string> {
	return new Promise( ( resolve, reject ) => {
		exec( command, ( error, stdout, stderr ) => {
			if ( error ) {
				reject( error );
			} else {
				resolve( stdout );
			}
		} )
	} )
}

export function Sleep( time: number ) {
	return new Promise( resolve => {
		setTimeout( resolve, time )
	} )
}

/* 从@消息中获取@的用户 */
export function idParser( id: string ): { code: string, target: string } {
	const result = id.match( /<@!(.*)>/ );
	let targetID;
	if ( result === null ) {
		return { code: "error", target: "用户匹配出错." };
	} else {
		targetID = result[1];
		return { code: "ok", target: targetID };
	}
}

export function obj2ParamsStr( obj: object ): string {
	const params: string[] = [];
	for ( let key in obj ) {
		params.push( `${ key }=${ obj[key] }` );
	}
	return params.join( '&' );
}