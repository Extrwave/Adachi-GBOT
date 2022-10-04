import { InputParameter } from "@modules/command";
import { execHandle } from "@modules/utils/utils";


export async function main( { sendMessage, logger }: InputParameter ): Promise<void> {
	await sendMessage( "开始重启 BOT，请稍后" );
	try {
		await execHandle( "pm2 restart adachi-gbot" );
	} catch ( error ) {
		logger.error( error );
		await sendMessage( `重启 BOT 出错: ${ ( <Error>error ).message }` );
	}
}