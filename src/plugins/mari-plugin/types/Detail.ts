/**
 * @interface
 * 圣遗物属性信息
 * @attr 圣遗物属性名
 * @value 圣遗物属性值
 * @icon iconPark图标
 * @color 图标颜色
 */
export interface ArtAttr {
	attr: string;
	value: string;
	icon: string;
	color: string;
}

/**
 * @interface
 * 天赋信息
 * @level 等级
 * @ext 等级是否存在额外加成
 */
export interface SkillInfo {
	level: number;
	ext: boolean;
}

/**
 * @interface
 * 武器属性
 * @name 名称
 * @star 星级
 * @level 等级
 * @promote 突破层数
 * @affix 精炼次数
 * @attrs 属性列表
 */
export interface Weapon {
	name: string;
	star: number;
	level: number;
	promote: number;
	affix: number;
	attrs: ArtAttr[];
}

/**
 * @interface
 * 圣遗物套装效果
 * @name 套装名
 * @count 几件套
 * @effect 套装效果
 */
export interface Effect {
	name: string;
	count: number;
	effect: string;
}

/**
 * @interface
 * 角色信息
 * @id 角色编号
 * @name 角色名
 * @level 等级
 * @fetter 好感度
 * @weapon 武器信息
 * @artifact 圣遗物信息
 * @talent 命座层数
 * @skill 天赋信息
 */
export interface Avatar {
	id: number;
	name: string;
	level: number;
	fetter: number;
	overview: Overview[];
	weapon: Weapon;
	artifact: {
		list: ( Artifact | {} )[];
		effects: Effect[];
	};
	talent: number;
	skill: Skill;
}


/**
 * @interface
 * 圣遗物信息
 * @shirtId 套装id
 * @shirtName 套装名称
 * @artifactName 单件名称
 * @level 等级
 * @mainAttr 主属性信息
 * @subAttr 副属性信息组
 */
export interface Artifact {
	shirtId: string;
	shirtName: string;
	artifactName: string;
	rank: number;
	level: number;
	mainAttr: ArtAttr;
	subAttr: ArtAttr[];
}

/**
 * @interface
 * 角色面板数据
 * @attr 属性名
 * @icon iconPark图标
 * @color 图标颜色
 * @baseValue 基础值
 * @addValue 增加值
 * @resultValue 结果值
 */
export interface Overview {
	attr: string;
	icon: string;
	color: string;
	baseValue: string;
	extraValue: string;
	resultValue: string;
}

export type Skill = Record<string, SkillInfo>;

export interface Detail {
	nickname: string;
	avatars: Avatar[]
}