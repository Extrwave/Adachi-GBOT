import { scheduleJob } from "node-schedule";
import { getCharacterId } from "#mari-plugin/utils/api";

export class CharacterId {
	public map: Record<string, number> = {};
	public idMap: Record<string, string> = {};
	
	constructor() {
		this.initData().then();
		scheduleJob( "0 0 0 * * *", async () => {
			await this.initData();
		} );
	}

	private async initData() {
		this.map = await getCharacterId();
		for ( const name in this.map ) {
			this.idMap[this.map[name]] = name;
		}
	}
}