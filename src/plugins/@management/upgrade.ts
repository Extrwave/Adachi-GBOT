import fetch from "node-fetch";
import { InputParameter } from "@modules/command";
import { execHandle } from "@modules/utils/utils";

/* 超时检查 */
function waitWithTimeout( promise: Promise<any>, timeout: number ): Promise<any> {
	let timer;
	const timeoutPromise = new Promise( ( _, reject ) => {
		timer = setTimeout( () => reject( `timeout: ${ timeout }ms` ), timeout );
	} );
	return Promise.race( [ timeoutPromise, promise ] )
		.finally( () => clearTimeout( timer ) );
}

/* 检查更新 */
async function getCommitsInfo(): Promise<any[]> {
	const result: Response = await fetch( "https://api.github.com/repos/Extrwave/Adachi-GBOT/commits" );
	return await result.json();
}

/* 更新 bot */
async function updateBot( { messageData, sendMessage, logger }: InputParameter ): Promise<void> {
	const isForce = messageData.msg.content === "-f";
	const command = !isForce ? "git checkout HEAD package*.json && git pull --no-rebase" : "git reset --hard && git pull --no-rebase";
	
	const execPromise = execHandle( command ).then( ( stdout: string ) => {
		logger.info( stdout );
		if ( /(Already up[ -]to[ -]date|已经是最新的)/.test( stdout ) ) {
			throw "当前已经是最新版本了";
		}
	} );
	
	try {
		await waitWithTimeout( execPromise, 30000 );
	} catch ( error ) {
		if ( typeof error === "string" ) {
			const errMsg = error.includes( "timeout" ) ? "更新失败，网络请求超时" : error;
			await sendMessage( errMsg );
		} else {
			await sendMessage( `更新失败，可能是网络出现问题${ !isForce ? "或存在代码冲突，若不需要保留改动代码可以追加 -f 使用强制更新" : "" }` );
		}
		logger.error( `更新 BOT 失败: ${ typeof error === "string" ? error : ( <Error>error ).message }` );
		throw error;
	}
	
	await sendMessage( "更新成功，BOT 正在自行重启，请稍后" );
	
	try {
		await execHandle( "pm2 restart adachi-gbot" );
	} catch ( error ) {
		throw error;
	}
}

export async function main( i: InputParameter ): Promise<void> {
	const dbKey: string = "adachi.update-time";
	
	let commits: any[] = []
	try {
		commits = await getCommitsInfo();
	} catch ( error ) {
		i.logger.error( error );
		await i.sendMessage( "检查更新出错，可能是网络波动，请重试" );
		return;
	}
	
	const newDate: string = commits[0].commit?.committer?.date;
	const oldDate: string = await i.redis.getString( dbKey );
	
	if ( !oldDate ) {
		await i.sendMessage( "初次使用该指令，将直接尝试更新 BOT" );
		try {
			await updateBot( i );
		} catch ( error ) {
			return;
		}
		await i.redis.setString( dbKey, newDate );
		return;
	}
	
	const commitsNew = commits.filter( e => {
		const commitDate: Date = new Date( e.commit?.committer?.date );
		return Number( commitDate ) - Number( new Date( oldDate ) ) > 0;
	} );
	
	if ( commitsNew.length === 0 ) {
		await i.sendMessage( "当前已经是最新版本了" );
		return;
	}
	
	await i.sendMessage( "开始尝试更新 BOT..." );
	
	try {
		await updateBot( i );
	} catch ( error ) {
		return;
	}
	await i.redis.setString( dbKey, newDate );
}