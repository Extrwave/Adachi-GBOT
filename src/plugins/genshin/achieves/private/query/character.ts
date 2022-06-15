import { InputParameter } from "@modules/command";
import { Private } from "#genshin/module/private/main";
import { RenderResult } from "@modules/renderer";
import { CharacterInformation, Skills } from "#genshin/types";
import { getRealName, NameResult } from "#genshin/utils/name";
import { mysAvatarDetailInfoPromise, mysInfoPromise } from "#genshin/utils/promise";
import { getPrivateAccount } from "#genshin/utils/private";
import { characterID, config, renderer } from "#genshin/init";

interface ScoreItem {
	label: string;
	percentage: number;
}

interface EvaluateScore {
	list: ScoreItem[];
	total: number;
}

function evaluate( obj: { rarity: number; level: number }, max: number = 5 ): number {
	return ( obj.rarity / max ) * obj.level;
}

export async function main(
	{ sendMessage, messageData, auth, redis, logger }: InputParameter
): Promise<void> {
	
	const userID = messageData.msg.author.id;
	const msg = messageData.msg.content;
	
	const parser = /(\d+)?\s*([\w\u4e00-\u9fa5]+)/i;
	const execRes = parser.exec( msg );
	if ( !execRes ) {
		await sendMessage( "指令格式有误" );
		return;
	}
	
	const [ , idMsg, name ] = execRes;
	
	const info: Private | string = await getPrivateAccount( userID, idMsg, auth );
	if ( typeof info === "string" ) {
		await sendMessage( info );
		return;
	}
	
	const { cookie, mysID, uid, server } = info.setting;
	const result: NameResult = getRealName( name );
	//优化我的角色查询
	const dbKey: string = `extr-wave-myrole-${ uid }`;
	const role_name: string = <string>result.info;
	const image: string = await redis.getHashField( dbKey, role_name );
	
	if ( image !== "" ) {
		await sendMessage( "七七找到了刚刚画好的图..." );
		await sendMessage( image );
		logger.info( `用户 ${ uid } 在六小时内查询过拥有角色 ${ role_name } ` );
	} else {
		
		if ( !result.definite ) {
			const message: string = result.info.length === 0
				? "查询失败，请检查角色名称是否正确"
				: `未找到相关信息，是否要找：${ [ "", ...<string[]>result.info ].join( "\n  - " ) }`;
			await sendMessage( message );
			return;
		}
		const realName: string = <string>result.info;
		const charID: number = characterID.map[realName];
		
		try {
			await mysInfoPromise( userID, mysID, cookie );
		} catch ( error ) {
			if ( error !== "gotten" ) {
				await sendMessage( <string>error );
				return;
			}
		}
		
		const { avatars } = await redis.getHash( `silvery-star.card-data-${ uid }` );
		const data: CharacterInformation[] = JSON.parse( avatars );
		const charInfo = data.find( ( { id } ) => {
			return charID === -1 ? id === 10000005 || id === 10000007 : id === charID;
		} );
		
		if ( !charInfo ) {
			await sendMessage( `[UID-${ uid }] 未拥有角色 ${ realName }` );
			return;
		}
		try {
			const dbKey: string = `silvery-star.character-temp-${ userID }`;
			const skills: Skills = await mysAvatarDetailInfoPromise(
				uid, charID, server, cookie, charInfo.constellations
			);
			
			const coefficients: number[] = [ 20, 15, 30, 35 ];
			const list: ScoreItem[] = [ {
				label: "圣遗物",
				percentage: charInfo.artifacts.reduce( ( pre, cur ) => pre + evaluate( cur ), 0 ) / 100
			}, {
				label: "武器等级",
				percentage: evaluate( charInfo.weapon ) / 90
			}, {
				label: "角色等级",
				percentage: charInfo.level / 90
			}, {
				label: "天赋升级",
				percentage: Math.min(
					skills.reduce(
						( pre, cur ) => pre + cur.levelCurrent, 0 ), 24
				) / 24
			} ];
			
			const score: EvaluateScore = {
				list,
				total: list.reduce( ( pre, cur, i ) => {
					return pre + cur.percentage * coefficients[i]
				}, 0 )
			};
			
			await redis.setString( dbKey, JSON.stringify( {
				...charInfo,
				skills,
				score,
				uid
			} ) );
		} catch ( error ) {
			await sendMessage( <string>error );
			return;
		}
		
		await sendMessage( "获取成功，七七努力画图中..." );
		const res: RenderResult = await renderer.asUrlImage(
			"/character.html", {
				qq: userID,
				showScore: config.showCharScore
			} );
		if ( res.code === "ok" ) {
			await sendMessage( { image: res.data } );
			await redis.setHashField( dbKey, role_name, res.data );
			await redis.setTimeout( dbKey, 6 * 3600 );
		} else {
			logger.error( res.error );
			await sendMessage( "图片渲染异常，请联系持有者进行反馈" );
		}
	}
}