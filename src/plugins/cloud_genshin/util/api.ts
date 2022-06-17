import request from "@modules/requests";

const NotificationURL = 'https://api-cloudgame.mihoyo.com/hk4e_cg_cn/gamer/api/listNotifications?status=NotificationStatusUnread&type=NotificationTypePopup&is_sort=true';
const WalletURL = 'https://api-cloudgame.mihoyo.com/hk4e_cg_cn/wallet/wallet/get';
const AnnouncementURL = 'https://api-cloudgame.mihoyo.com/hk4e_cg_cn/gamer/api/getAnnouncementInfo';

export interface HEADERS {
	'x-rpc-combo_token': string,
	'x-rpc-client_type': number,  //默认安卓
	'x-rpc-app_version': string, //当前云原神版本
	'x-rpc-sys_version': number, //当前安卓版本
	'x-rpc-channel': string,
	'x-rpc-device_id': string,
	'x-rpc-device_name': string,
	'x-rpc-device_model': string,
	'x-rpc-app_id': string,
	'Referer': string,
	'Host': string,
	'Connection': string,
	'Accept-Encoding': string,
	'User-Agent': string
}


export async function getWalletURL( header: HEADERS ): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: WalletURL,
			headers: header
		} )
			.then( ( result ) => {
				resolve( result );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getAnnouncementURL( header: HEADERS ): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: AnnouncementURL,
			headers: header
		} )
			.then( ( result ) => {
				resolve( result );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getNotificationURL( header: HEADERS ): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: NotificationURL,
			headers: header
		} )
			.then( ( result ) => {
				resolve( result );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}