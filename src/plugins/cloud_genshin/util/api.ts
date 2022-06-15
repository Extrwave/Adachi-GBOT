import request from "#genshin/utils/requests";

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
};

export const headers: HEADERS = {
	'x-rpc-combo_token': "",
	'x-rpc-client_type': 2,  //默认安卓
	'x-rpc-app_version': "2.4.0", //当前云原神版本
	'x-rpc-sys_version': 12.0, //当前安卓版本
	'x-rpc-channel': 'mihoyo',
	'x-rpc-device_id': "3fe1b5d6-441d-3698-a43c-d334a2d078aa",
	'x-rpc-device_name': "Meizu 16s Pro",
	'x-rpc-device_model': "16s Pro",
	'x-rpc-app_id': "1953439974",
	'Referer': 'https://app.mihoyo.com',
	'Host': 'api-cloudgame.mihoyo.com',
	'Connection': 'Keep-Alive',
	'Accept-Encoding': 'gzip',
	'User-Agent': 'okhttp/4.9.0'
};


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