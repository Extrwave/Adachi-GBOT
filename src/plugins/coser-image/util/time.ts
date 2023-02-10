/**
Author: Ethereal
CreateTime: 2022/6/29
 */

export function secondToString( ttl: number ): string {
	
	const hour = Math.floor( ttl / 3600 );
	const minute = Math.floor( ( ttl - hour * 3600 ) / 60 );
	const second = ttl % 60;
	return `${ hour } 时 ${ minute } 分 ${ second } 秒`;
}