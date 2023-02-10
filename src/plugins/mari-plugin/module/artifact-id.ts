import { scheduleJob } from "node-schedule";
import { getArtifactId } from "#mari-plugin/utils/api";

export class ArtifactId {
	public map: Record<string, string> = {};
	
	constructor() {
		getArtifactId().then( res => this.map = res );
		scheduleJob( "0 0 0 * * *", async () => {
			this.map = await getArtifactId();
		} );
	}
}