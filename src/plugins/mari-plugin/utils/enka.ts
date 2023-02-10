/**
 * 感谢 Enka 团队提供的面板查询服务
 * Enka 官方地址：https://enka.shinshin.moe/
 * 如果可以的话，考虑在 Patreon(https://patreon.com/algoinde) 上支持他们
 * 或提供闲置的原神账户，可通过 Discord(https://discord.gg/G3m7CWkssY) 联系他们
 */
import * as ApiType from "#mari-plugin/types";
import { artifactId, attrIcon, characterId } from "#mari-plugin/init";

/**
 * @interface
 * 角色属性总览映射对象
 * @label 属性名称
 * @baseCode 属性基础值对应的 enka 数据 code 码
 * @maxCode 属性最终值对应的 enka 数据 code 码
 * @percentCode 基础值放大比例对应的 enka 数据 code 码
 * @addCode 基础值增加值对应的 enka 数据 code 码
 * @percent 是否以百分比显示
 */
interface IAttrOverviewMap {
	label: string
	baseCode: number
	maxCode?: number
	percentCode?: number
	addCode?: number
	percent: boolean
}

const artiIdx: Record<string, ApiType.ArtIdx> = {
	EQUIP_BRACER: "arti1",
	EQUIP_NECKLACE: "arti2",
	EQUIP_SHOES: "arti3",
	EQUIP_RING: "arti4",
	EQUIP_DRESS: "arti5"
};

/* 不需要带百分比的属性 */
const attrNoPercent = [ "HP", "ATTACK", "BASE_ATTACK", "DEFENSE", "ELEMENT_MASTERY" ];

const attrMap = {
	HP: "生命值",
	HP_PERCENT: "生命值",
	ATTACK: "攻击力",
	ATTACK_PERCENT: "攻击力",
	BASE_ATTACK: "基础攻击力",
	DEFENSE: "防御力",
	DEFENSE_PERCENT: "防御力",
	ELEMENT_MASTERY: "元素精通",
	CHARGE_EFFICIENCY: "元素充能效率",
	CRITICAL: "暴击率",
	CRITICAL_HURT: "暴击伤害",
	HEAL_ADD: "治疗加成",
	FIRE_ADD_HURT: "火元素伤害加成",
	ICE_ADD_HURT: "冰元素伤害加成",
	ROCK_ADD_HURT: "岩元素伤害加成",
	ELEC_ADD_HURT: "雷元素伤害加成",
	WIND_ADD_HURT: "风元素伤害加成",
	WATER_ADD_HURT: "水元素伤害加成",
	GRASS_ADD_HURT: "草元素伤害加成",
	PHYSICAL_ADD_HURT: "物理伤害加成"
};

const attrOverviewMap: IAttrOverviewMap[] = [ {
	label: "生命值上限",
	baseCode: 1,
	maxCode: 2000,
	percent: false
}, {
	label: "攻击力",
	baseCode: 4,
	percentCode: 6,
	addCode: 5,
	percent: false
}, {
	label: "防御力",
	baseCode: 7,
	maxCode: 2002,
	percent: false
}, {
	label: "元素精通",
	baseCode: 28,
	percent: false
}, {
	label: "暴击率",
	baseCode: 20,
	percent: true
}, {
	label: "暴击伤害",
	baseCode: 22,
	percent: true
}, {
	label: "元素充能效率",
	baseCode: 23,
	percent: true
}, {
	label: "治疗加成",
	baseCode: 26,
	percent: true
}, {
	label: "物理伤害加成",
	baseCode: 30,
	percent: true
}, {
	label: "火元素伤害加成",
	baseCode: 40,
	percent: true
}, {
	label: "雷元素伤害加成",
	baseCode: 41,
	percent: true
}, {
	label: "水元素伤害加成",
	baseCode: 42,
	percent: true
}, {
	label: "草元素伤害加成",
	baseCode: 43,
	percent: true
}, {
	label: "风元素伤害加成",
	baseCode: 44,
	percent: true
}, {
	label: "岩元素伤害加成",
	baseCode: 45,
	percent: true
}, {
	label: "冰元素伤害加成",
	baseCode: 46,
	percent: true
} ]

export class EnKa {
	private readonly artifact: ApiType.EnKaArtifact;
	
	constructor(
		private readonly meta: ApiType.EnKaMeta,
		private readonly chara: ApiType.EnKaChara,
		artifact: ApiType.EnKaArtifact
	) {
		const formatArtifact: ApiType.EnKaArtifact = {};
		Object.values( artifact ).forEach( art => {
			formatArtifact[art.name] = art;
		} )
		this.artifact = formatArtifact;
	}
	
	/* 获取用户数据 */
	public getDetailInfo( data: ApiType.EnKa ): ApiType.Detail {
		if ( !data.avatarInfoList ) {
			throw new Error( "当前用户展示角色为空" );
		}
		const avatars: ApiType.Avatar[] = data.avatarInfoList.map( chara => {
			const avatarId = chara["avatarId"];
			const level: string | undefined = chara.propMap['4001'].val;
			return {
				id: avatarId,
				name: characterId.idMap[avatarId],
				level: level ? parseInt( level ) : 0,
				fetter: chara.fetterInfo.expLevel,
				overview: this.getOverviewAttr( chara.fightPropMap ),
				weapon: this.getWeapon( chara.equipList ),
				artifact: this.getArtifact( chara.equipList ),
				talent: chara.talentIdList ? <number>chara.talentIdList.length : 0,
				skill: this.getSkill( avatarId, chara.skillLevelMap, chara.proudSkillExtraLevelMap ),
				updateTime: new Date().getTime()
			}
		} );
		return {
			nickname: data.playerInfo.nickname,
			avatars
		}
	}
	
	private getOverviewAttr( data: Record<string, number> ): ApiType.Overview[] {
		const attrList: ApiType.Overview[] = [];
		for ( const attr of attrOverviewMap ) {
			const base = data[attr.baseCode];
			
			if ( !base ) continue;
			
			const add = attr.addCode && data[attr.addCode] ? data[attr.addCode] : 0;
			const percent = attr.percentCode && data[attr.percentCode] ? data[attr.percentCode] : 0;
			const max = attr.maxCode && data[attr.maxCode] ? data[attr.maxCode] : 0;
			
			/* 获取结果值 */
			const resultValue = max || ( base * ( 1 + percent ) + add );
			
			/* 计算新增值 */
			const extraValue = max || add || percent
				? max
					? max - base
					: resultValue - base
				: 0
			
			/* 整理结果数值 */
			const getResult = ( value: number ): string => {
				if ( !value ) return "";
				return attr.percent ? ( value * 100 ).toFixed( 1 ) + '%' : value.toFixed( 0 );
			};
			
			attrList.push( {
				attr: attr.label,
				icon: attrIcon.map[attr.label]?.icon,
				color: attrIcon.map[attr.label]?.color || "",
				baseValue: getResult( base ),
				extraValue: getResult( extraValue ),
				resultValue: getResult( resultValue )
			} )
		}
		return attrList;
	}
	
	/* 获取武器信息 */
	private getWeapon( data: Array<ApiType.EnKaEquip> ): ApiType.Weapon {
		const weaponData = data.find( d => d.flat.itemType === "ITEM_WEAPON" );
		if ( !weaponData ) {
			throw new Error( "enka获取武器数据异常" );
		}
		const { weapon, flat } = <ApiType.EnKaWeaponEquip>weaponData;
		const attrs: ApiType.ArtAttr[] = flat.weaponStats.map( s => {
			return this.getArtInfo( s );
		} );
		const affixValues = weapon.affixMap ? Object.values( weapon.affixMap ) : [ 0 ];
		
		return {
			name: this.meta[flat.nameTextMapHash],
			star: flat.rankLevel,
			level: weapon.level,
			promote: weapon.promoteLevel,
			affix: ( affixValues[0] || 0 ) + 1,
			attrs
		}
	}
	
	/* 获取圣遗物信息 */
	private getArtifact( data: Array<ApiType.EnKaEquip> ): { list: Array<ApiType.Artifact | {}>, effects: Array<ApiType.Effect> } {
		/* 圣遗物属性对象 */
		const ret: Array<ApiType.Artifact | {}> = new Array( 5 ).fill( {} );
		
		/* 统计圣遗物套装 */
		const tmpSetBucket: Record<string, any> = {};
		
		/* 过滤武器对象 */
		const reliquaryData = <ApiType.EnKaReliquaryEquip[]>data.filter( d => d.flat.itemType !== "ITEM_WEAPON" );
		
		for ( const { flat, reliquary } of reliquaryData ) {
			/* 圣遗物部位编号 */
			const artIdx = artiIdx[flat.equipType];
			if ( !artIdx ) continue;
			
			const artShirtName = this.meta[flat.setNameTextMapHash] || "";
			const artShirtId = artifactId.map[artShirtName] || "";
			
			const artInfo = this.artifact[artShirtName];
			const artSet = artInfo.sets[artIdx];
			
			/* 圣遗物属性列表 */
			const sub = flat.reliquarySubstats;
			
			const artIndex = parseInt( <string>artIdx.split( "arti" ).pop() ) - 1;
			ret[artIndex] = {
				shirtId: artShirtId,
				shirtName: artShirtName,
				artifactName: artSet.name,
				rank: flat?.rankLevel || 1,
				level: Math.min( 20, ( reliquary?.level || 1 ) - 1 ),
				mainAttr: this.getArtInfo( flat.reliquaryMainstat ),
				subAttr: sub ? sub.map( s => this.getArtInfo( s ) ) : []
			}
			/* 存放圣遗物套装信息 */
			const t = tmpSetBucket[artShirtName];
			tmpSetBucket[artShirtName] = {
				count: t?.count ? t.count + 1 : 1,
				effect: t?.effect ?? artInfo.effect
			}
		}
		
		/* 套装属性对象 */
		const effects: ApiType.Effect[] = [];
		for ( const key of Object.keys( tmpSetBucket ) ) {
			const { count, effect } = tmpSetBucket[key];
			for ( const num in effect ) {
				if ( count >= num ) {
					effects.push( {
						name: key,
						count: parseInt( num ),
						effect: effect[num]
					} )
				}
			}
		}
		
		return { list: ret, effects };
	}
	
	/* 获取天赋信息 */
	private getSkill( charId: number, skillLevelMap: Record<string, number>, extSkillLevelMap: Record<string, number> = {} ): ApiType.Skill {
		let { Skills, ProudMap } = this.chara[charId];
		let idx = 1;
		/* 映射对象，a 普攻 s 战技 e 爆发 */
		const idxMap = { a: "a", s: "e", e: "q" };
		
		/* 天赋 数字id/额外等级 与 技能类型的映射 */
		const skillTypeMap: Record<string, string> = {};
		
		/* 存放 天赋 数字id 与 技能类型的映射 */
		for ( const sId in Skills ) {
			const skillsIdName = Skills[sId];
			/* 提取 Skill_S_Itto_01 中的 S */
			const exec = /skill_(\w)/.exec( skillsIdName.toLowerCase() );
			skillTypeMap[sId] = idxMap[<string>( exec && exec[1] )];
		}
		
		/* 存放 天赋额外等级 数字id 与 技能类型的映射 */
		for ( const sId in ProudMap ) {
			const sExtId = ProudMap[sId];
			skillTypeMap[sExtId] = skillTypeMap[sId];
		}
		/* 技能等级对象，技能类型：等级 */
		const skillInfo: ApiType.Skill = {};
		
		/* 设置天赋基础等级 */
		for ( const sId in skillLevelMap ) {
			const skillType = skillTypeMap[sId];
			const skillLevel = skillLevelMap[sId];
			skillInfo[skillType] = {
				level: skillLevel,
				ext: false
			};
		}
		
		/* 设置总天赋等级： 基础+额外 */
		for ( const sExtId in extSkillLevelMap ) {
			const skillType = skillTypeMap[sExtId];
			const extSkillLevel = extSkillLevelMap[sExtId];
			if ( skillInfo[skillType] ) {
				skillInfo[skillType].level = skillInfo[skillType].level + extSkillLevel;
				skillInfo[skillType].ext = true;
			}
		}
		
		return skillInfo;
	}
	
	/* 获取圣遗物属性信息，[属性名, 值] */
	private getArtInfo( data: { mainPropId?: string; appendPropId?: string; statValue: number } ): ApiType.ArtAttr {
		let propId = data.appendPropId || data.mainPropId || "";
		propId = propId.replace( "FIGHT_PROP_", "" );
		
		const attrName = attrMap[propId];
		if ( !attrName ) {
			return {
				attr: "",
				value: "",
				icon: "",
				color: ""
			}
		}
		
		const percentMark = attrNoPercent.includes( propId ) ? "" : "%";
		
		return {
			attr: attrName,
			value: data.statValue.toString() + percentMark,
			icon: attrIcon.map[attrName]?.icon,
			color: attrIcon.map[attrName]?.color || "",
		}
	}
}