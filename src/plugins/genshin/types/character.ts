/**
 * @interface
 * 角色数据
 * @avatars 角色数据列表
 * */
export interface Character {
	type: "character";
	avatars: Avatar[];
}

/**
 * @interface
 * 单个角色数据
 * @id 角色 ID
 * @image 角色图片
 * @icon 角色图标
 * @name. 角色名
 * @element 元素属性
 * @fetter 好感度
 * @level 角色等级
 * @weapon 使用武器数据
 * @reliquaries 佩戴圣遗物数据
 * @constellations 命之座数据
 * @activedConstellationNum 激活命之座数量
 * @costumes 角色装扮
 * */
export interface Avatar {
	id: number;
	image: string;
	icon: string;
	name: string;
	element: string;
	fetter: number;
	level: number;
	rarity: number;
	weapon: Weapon;
	reliquaries: Artifact[];
	constellations: Constellation[];
	activedConstellationNum: number;
	costumes: Costume[];
}

/**
 * @interface
 * 武器数据
 * @id 武器 ID
 * @name. 武器名
 * @icon 武器图标
 * @type. 武器类型
 * @typeName 武器类型名
 * @rarity 武器稀有度
 * @level 武器等级
 * @promoteLevel 突破等级
 * @affixLevel 精炼等级
 * @desc 武器描述
 * */
export interface Weapon {
	id: number;
	name: string;
	icon: string;
	type: number;
	rarity: number;
	level: number;
	promoteLevel: number;
	typeName: string;
	desc: string;
	affixLevel: number;
}

/**
 * @interface
 * 圣遗物数据
 * @id 圣遗物 ID
 * @name. 圣遗物名称
 * @icon 圣遗物图标
 * @pos 圣遗物佩戴部位
 * @posName 佩戴部位名
 * @rarity 稀有度
 * @level 圣遗物等级
 * @affixes 套装效果
 * */
export interface Artifact {
	id: number;
	name: string;
	icon: string;
	pos: number;
	rarity: number;
	level: number;
	set: ArtifactSet;
	posName: string;
}

/**
 * @interface
 * 圣遗物套装
 * @id 套装 ID
 * @name. 套装名
 * @affixes 套装效果
 * */
export interface ArtifactSet {
	id: number;
	name: string;
	affixes: ArtifactAffixes[];
}

/**
 * @interface
 * 圣遗物套装效果
 * @activationNumber 触发效果所需圣遗物件数
 * @effect 圣遗物套装效果
 * */
export interface ArtifactAffixes {
	activationNumber: number;
	effect: string;
}

/**
 * @interface
 * 命之座数据
 * @id 命之座 ID
 * @name. 命之座名称
 * @icon 命之座图标
 * @effect 命之座效果(含HTML标签)
 * @isActived 是否激活
 * @pos 命之座层数
 * */
export interface Constellation {
	id: number;
	name: string;
	icon: string;
	effect: string;
	isActived: boolean;
	pos: number;
}

/**
 * @interface
 * 装扮数据
 * @id 装扮 ID
 * @name. 装扮名
 * @icon 装扮图标
 * */
export interface Costume {
	id: number;
	name: string;
	icon: string;
}

export type CharacterBase = Omit<Avatar, "image" | "weapon" | "reliquaries" | "constellations">;
export type CharacterWeapon = Omit<Weapon, "id" | "type" | "promoteLevel" | "typeName"> & { image: string };
export type CharacterArt = Array<Pick<Artifact, "pos" | "rarity" | "icon" | "level">>;
export type CharacterConDetail = Array<Pick<Constellation, "name" | "icon" | "isActived">>;

export type CharacterConSkill = {
	skillName: string;
	level: number;
	requirementNum: number;
};
export type CharacterCon = {
	detail: CharacterConDetail;
	activedNum: number;
	upSkills: CharacterConSkill[];
};
export type CharacterEffect = Array<{
	icon: string;
	name: string;
}>;

export type CharacterInformation = {
	weapon: CharacterWeapon;
	constellations: CharacterCon;
	artifacts: CharacterArt;
	effects: CharacterEffect;
} & CharacterBase;

export type ArtifactSetStat = {
	count: number;
	effect: ArtifactAffixes[];
	icon: string;
};