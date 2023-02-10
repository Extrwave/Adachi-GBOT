import { scheduleJob } from "node-schedule";
import { getAttrIcon } from "#mari-plugin/utils/api";
import { AttrIconMap } from "#mari-plugin/types";

export class AttrIcon {
	public map: AttrIconMap = {};
	
	constructor() {
		getAttrIcon().then( res => this.map = res );
		scheduleJob( "0 0 0 * * *", async () => {
			this.map = await getAttrIcon();
		} );
	}
}