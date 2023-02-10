// https://enka.shinshin.moe/

export type EnKaEquip = EnKaReliquaryEquip | EnKaWeaponEquip

export interface EnKa {
	playerInfo: EnKaPlayInfo
	avatarInfoList: EnKaAvatar[]
}

/**
 * @interface
 * enKa 用户信息数据
 * @nickname 用户名
 * @level 等级
 * @worldLevel 世界等级
 * @nameCardId 佩戴成就卡片id
 * @finishAchievementNum 成就完成数量
 * @towerFloorIndex 深渊最大通关层数
 * @towerLevelIndex 深渊层数索引（9层0起）
 * @showAvatarInfoList 看板角色列表 id-level
 * @showNameCardIdList 看板成就卡片id列表
 * @profilePicture 当前头像id对象
 */
export interface EnKaPlayInfo {
	nickname: string;
	level: number;
	worldLevel: number;
	nameCardId: number;
	finishAchievementNum: number,
	towerFloorIndex: number,
	towerLevelIndex: number,
	showAvatarInfoList: Array<{
		avatarId: number;
		level: number;
	}>,
	"showNameCardIdList": Array<number>,
	"profilePicture": {
		avatarId: number
	}
}

/**
 * @interface
 * enKa 角色数据
 * @avatarId 角色id
 * @propMap 人物属性映射表【4001 等级】
 * @talentIdList 命座id列表
 * @fightPropMap 面板数据映射表
 * @skillLevelMap 天赋id-level映射表
 * @proudSkillExtraLevelMap 天赋额外附加等级id-level映射表
 * @fetterInfo 好感度信息
 */
export interface EnKaAvatar {
	avatarId: number;
	propMap: Record<string, EnKaPropMap>;
	talentIdList: number[];
	fightPropMap: Record<string, number>;
	skillLevelMap: Record<string, number>;
	proudSkillExtraLevelMap: Record<string, number>;
	equipList: Array<EnKaEquip>;
	fetterInfo: {
		expLevel: number;
	};
}

/**
 * @interface
 * 人物属性映射表【4001 等级】
 * @type 属性id
 * @ival 未知
 * @val 属性值
 */
export interface EnKaPropMap {
	type: number;
	ival: string;
	val?: string;
}

/**
 * @interface
 * 角色装备（圣遗物）
 * @reliquary 圣遗物概览
 */
export interface EnKaReliquaryEquip {
	reliquary: Reliquary;
	flat: EnKaFlatReliquary;
}

/**
 * @interface
 * 角色装备（武器）
 * @weapon 武器概览
 */
export interface EnKaWeaponEquip {
	weapon: Weapon;
	flat: EnKaFlatWeapon;
}

/**
 * @interface
 * 角色装备（圣遗物概览）
 * @level 等级（多着1）
 * @mainPropId 主属性id
 * @appendPropIdList 该部位所有附加属性id数组
 */
interface Reliquary {
	level: number;
	mainPropId: number;
	appendPropIdList: number[];
}

/**
 * @interface
 * 角色装备（武器概览）
 * @level 等级
 * @promoteLevel 突破次数
 * @affixMap 精炼映射表（只有一项，属性值就是精炼次数）低星武器不存在该值
 */
interface Weapon {
	level: number;
	promoteLevel: number;
	affixMap?: Record<string, number>;
}

/**
 * @interface
 * 圣遗物flat对象
 * @nameTextMapHash 圣遗物名称id
 * @setNameTextMapHash 套装属性id
 * @rankLevel 星级
 * @reliquaryMainstat 主属性信息
 * @reliquarySubstats 副属性信息（一星圣遗物可能会没有）
 * @itemType 装备类型
 * @equipType 圣遗物类型
 */
export interface EnKaFlatReliquary {
	nameTextMapHash: string;
	setNameTextMapHash: string;
	rankLevel: number;
	reliquaryMainstat: {
		mainPropId: string;
		statValue: number;
	};
	reliquarySubstats?: Array<{
		appendPropId: string;
		statValue: number;
	}>;
	itemType: string;
	equipType: string;
}

/**
 * @interface
 * 武器flat对象
 * @nameTextMapHash 武器名称id
 * @rankLevel 星级
 * @weaponStats 武器属性名-属性值
 * @itemType 装备类型
 */
export interface EnKaFlatWeapon {
	nameTextMapHash: string;
	rankLevel: number;
	weaponStats: Array<{
		appendPropId: string;
		statValue: number;
	}>
	itemType: string;
}