export const DB_KEY = {
	ANALYSIS_URL: "genshin_draw_analysis.url",
	ANALYSIS_COOKIE: "genshin_draw_analysis.cookie",
	ANALYSIS_DATA: "genshin_draw_analysis.data"
}


export interface AuthKey {
	sign_type: number;
	authkey_ver: number;
	authkey: string;
}

export interface GachaPoolInfo {
	begin_time: string;
	end_time: string;
	gacha_id: string;
	gacha_name: string;
	gacha_type: number;
}

export interface Gacha_Info {
	uid: string;
	gacha_type: string;
	item_id: string;
	count: string;
	time: string;
	name: string;
	lang: string;
	item_type: string;
	rank_type: string;
	id: string;
}

export interface Standard_Gacha {
	info: Standard_Gacha_Info;
	list: Standard_Gacha_Data[];
}

export interface Standard_Gacha_Info {
	uid: string;
	lang: string;
	export_time: string;
	export_timestamp: number;
	export_app: string;
	export_app_version: string;
	uigf_version: string;
}

export interface Standard_Gacha_Data {
	id: string | null | undefined;
	name: string;
	item_id: string;
	item_type: string;
	rank_type: string;
	gacha_type: string;
	count: string;
	time: string;
	uigf_gacha_type: string;
}

export interface Standard_Gacha_Excel_Origin_Data {
	count: string;
	gacha_type: string;
	id: string | null | undefined;
	item_id: string;
	item_type: string;
	lang: string;
	name: string;
	rank_type: string;
	time: string;
	uid: string;
	uigf_gacha_type: string;
}

export interface FakeIdFunc {
	(): string;
}

export interface Standard_Gacha_Excel {
	time: string;
	name: string;
	item_type: string;
	rank_type: string;
	gacha_type: string;
}

export interface QiniuOssConfig {
	accessKey: string;
	secretKey: string;
	bucket: string;
	// 带协议头
	domain: string;
	// 上传后的目录
	folder: string;
}