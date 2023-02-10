import { scheduleJob } from "node-schedule";
import { EnKaArtifact, EnKaChara, EnKaMeta } from "#mari-plugin/types";
import { getEnKaArtifact, getEnKaChara, getEnKaMeta } from "#mari-plugin/utils/api";

export class EnKaClass {
	public chara: EnKaChara = {};
	public artifact: EnKaArtifact = {};
	public meta: EnKaMeta = {};
	
	constructor() {
		this.initData().then();
		scheduleJob( "0 0 0 * * *", async () => {
			await this.initData();
		} );
	}
	
	private async initData() {
		this.chara = await getEnKaChara();
		this.artifact = await getEnKaArtifact();
		this.meta = await getEnKaMeta();
	}
}