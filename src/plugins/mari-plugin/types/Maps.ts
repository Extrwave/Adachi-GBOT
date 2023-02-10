export type ArtIdx = "arti1" | "arti2" | "arti3" | "arti4" | "arti5"

/**
 * @interface
 * enKa圣遗物套装映射数据
 * @id 套装id
 * @name 套装中文名称
 * @sets 散件信息
 * @effect 套装效果
 */
export interface EnKaArtifactInfo {
	id: string;
	name: string;
	sets: {
		[P in ArtIdx]: {
			id: string;
			name: string;
		}
	};
	effect: Record<string, string>;
}

/**
 * @interface
 * enKa角色映射信息
 * @skill 技能数字id与技能英文id映射
 * @ProudMap 技能数字id与技能额外新增id映射
 * @Costumes 未知
 */
export interface EnKaCharaInfo {
	Skills: Record<string, string>;
	ProudMap: Record<string, number>;
	Costumes: {
		[P in string]: {
			icon: string;
			art: string;
			avatarId: number;
		}
	}
}

/**
 * @interface
 * 属性图标及颜色映射
 * @icon iconPark图标
 * @color 颜色
 */
export interface AttrIconInfo {
	icon: string;
	color?: string;
}

export type EnKaArtifact = Record<string, EnKaArtifactInfo>;
export type EnKaChara = Record<string, EnKaCharaInfo>;
export type EnKaMeta = Record<string, string>;
export type AttrIconMap = Record<string, AttrIconInfo>;