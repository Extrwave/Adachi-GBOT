/**
Author: Ethereal
CreateTime: 2022/6/28
 */

/** 米游社获取参数说明
 *
 * last_id 翻页标识号，一页返回20条帖子
 *      0：开头
 *      1：第二页...
 *
 * forum_id 帖子分类标识
 *      28：原神官方帖子
 *      29：原神同人图
 *      49：原神coser
 *      47：大别野coser
 *
 * sort_type 列表分类
 *    0/2：最近发布
 *      1：最近回复
 *      undefine 热榜
 *
 * */
import requests from '@modules/requests'

const API = {
	MYS: "https://bbs-api.mihoyo.com/post/wapi/getForumPostList?&is_good=false&is_hot=true&page_size=20",
	Animation: "https://img.xjh.me/random_img.php?return=url"
}

export enum Forum {
	Official = 28,
	GenshinT = 29,
	GenshinCoser = 49,
	SquareCoser = 47
}

export interface CosPost {
	author: string,
	uid: string,
	images: string[]
}

export async function getPostImage( type: Forum, last_id: number = 0 ): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		requests( {
			method: "GET",
			url: API.MYS + `&last_id=${ last_id }&forum_id=${ type }`,
		} )
			.then( ( result ) => {
				resolve( JSON.parse( result ) );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getAnimation(): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		requests( {
			method: "GET",
			url: API.Animation,
		} )
			.then( ( result ) => {
				resolve( "http:" + result );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}