import fetch from "node-fetch";
import { parse } from "yaml";
import { AttrIconMap, EnKa, EnKaArtifact, EnKaChara, EnKaMeta } from "#mari-plugin/types";

const __API = {
	FETCH_CHARACTER_ID: "https://mari-plugin.oss-cn-beijing.aliyuncs.com/docs/character_id.yml",
	FETCH_ARTIFACT_ID: "https://mari-plugin.oss-cn-beijing.aliyuncs.com/docs/artifact_id.yml",
	/* enka */
	FETCH_CHARA_DETAIL: "u/$/__data.json",
	FETCH_ENKA_ARTIFACT: "https://mari-plugin.oss-cn-beijing.aliyuncs.com/enka/artifact.yml",
	FETCH_ENKA_CHARA: "https://mari-plugin.oss-cn-beijing.aliyuncs.com/enka/chara.yml",
	FETCH_ENKA_META: "https://mari-plugin.oss-cn-beijing.aliyuncs.com/enka/meta.yml",
	FETCH_ATTR_ICON: "https://mari-plugin.oss-cn-beijing.aliyuncs.com/docs/attr_icon.yml"
};

export async function getCharacterId(): Promise<Record<string, number>> {
	const result: Response = await fetch( __API.FETCH_CHARACTER_ID );
	return parse( await result.text() );
}

export async function getArtifactId(): Promise<Record<string, string>> {
	const result: Response = await fetch( __API.FETCH_ARTIFACT_ID );
	return parse( await result.text() );
}

export async function getCharaDetail( origin: string, uid: number ): Promise<EnKa> {
	const charaDetailApi = origin + __API.FETCH_CHARA_DETAIL.replace( "$", uid.toString() );
	
	const result: Response = await fetch( charaDetailApi, {
		headers: {
			"User-Agent": `mari-plugin/1.0`
		}
	} );
	return await result.json();
}

export async function getEnKaArtifact(): Promise<EnKaArtifact> {
	const result: Response = await fetch( __API.FETCH_ENKA_ARTIFACT );
	return parse( await result.text() );
}

export async function getEnKaChara(): Promise<EnKaChara> {
	const result: Response = await fetch( __API.FETCH_ENKA_CHARA );
	return parse( await result.text() );
}

export async function getEnKaMeta(): Promise<EnKaMeta> {
	const result: Response = await fetch( __API.FETCH_ENKA_META );
	return parse( await result.text() );
}

export async function getAttrIcon(): Promise<AttrIconMap> {
	const result: Response = await fetch( __API.FETCH_ATTR_ICON );
	return parse( await result.text() );
}