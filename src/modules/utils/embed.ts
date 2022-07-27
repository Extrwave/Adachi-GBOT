import { Embed, EmbedField, EmbedThumbnail } from "qq-guild-bot";

/**
Author: Ethereal
CreateTime: 2022/7/27
 */

export class EmbedMsg implements Embed {
	description?: string;
	fields: EmbedField[];
	prompt?: string;
	thumbnail?: EmbedThumbnail;
	title: string;
	
	constructor
	( title: string,
	  description?: string,
	  prompt?: string,
	  icon?: string, ...fields: string[] ) {
		this.title = title;
		this.description = description;
		this.prompt = prompt;
		if ( icon ) {
			this.thumbnail = { url: icon };
		}
		this.fields = [];
		for ( let field of fields ) {
			this.fields.push( { name: field } );
		}
	}
}