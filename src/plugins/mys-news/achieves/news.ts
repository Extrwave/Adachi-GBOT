import { InputParameter } from "@modules/command";
import { API, getNews } from "#mys-news/utils/api";

/**
Author: Ethereal
CreateTime: 2022/7/6
 */
export async function main( { messageData, sendMessage }: InputParameter ) {
	const content = messageData.msg.content;
	let data;
	if ( content === 'acti' ) {
		data = JSON.parse( await getNews( API.acti ) );
		// } else if ( content === 'info' ) {
		// 	data = JSON.parse( await getNews( API.info ) );
	} else {
		data = JSON.parse( await getNews( API.anno ) );
	}
	if ( data.retcode === 0 && data.message === 'OK' ) {
		const postList = data.data.list;
		for ( const post of postList ) {
			let rawContent = "";
			const content = JSON.parse( post.post.structured_content );
			for ( let i = 1; i < content.length; i++ ) {
				if ( i === 0 )
					continue;
				if ( /http/.test( content[i].insert ) ) {
					rawContent += "隐藏Link"
					continue;
				}
				rawContent += content[i].insert;
			}
			const msg = {
				content: `${ post.post.subject }\n\n${ rawContent }`,
				image: post.post.images[0]
			}
			await sendMessage( msg );
		}
	}
}