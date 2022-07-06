import requests from "@modules/requests";

/**
Author: Ethereal
CreateTime: 2022/7/6
 */

export enum API {
	anno = "https://bbs-api.mihoyo.com/post/api/getNewsList?gids=2&last_id=0&page_size=2&type=1",
	acti = "https://bbs-api.mihoyo.com/post/api/getNewsList?gids=2&last_id=0&page_size=2&type=2",
	info = "https://bbs-api.mihoyo.com/post/api/getNewsList?gids=2&last_id=0&page_size=2&type=3"
	//info图片体积太大，无法发送
}

export async function getNews( type: API ): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		requests( {
			method: "GET",
			url: type,
		} )
			.then( ( result ) => {
				resolve( result );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}




