import request from "#genshin/utils/requests";

const NotificationURL = 'https://api-cloudgame.mihoyo.com/hk4e_cg_cn/gamer/api/listNotifications?status=NotificationStatusUnread&type=NotificationTypePopup&is_sort=true';
const WalletURL = 'https://api-cloudgame.mihoyo.com/hk4e_cg_cn/wallet/wallet/get';
const AnnouncementURL = 'https://api-cloudgame.mihoyo.com/hk4e_cg_cn/gamer/api/getAnnouncementInfo';

const HEADERS = {
	'x-rpc-combo_token': "ai=4;ci=1;oi=216316231;ct=ca746413ec130f85bbc54e50d10151b77d383fbe;si=d674662c98c2ba6305a870291a01e8f6d349dac7ad57d718b86c1017d8821090;bi=hk4e_cn",
	'x-rpc-client_type': 2,
	'x-rpc-app_version': "2.2.0",
	'x-rpc-sys_version': 7.0,
	'x-rpc-channel': 'mihoyo',
	'x-rpc-device_id': "3fe1b5d6-441d-3698-a43c-d334a2d078aa",
	'x-rpc-device_name': "Meizu M5 Note",
	'x-rpc-device_model': "M5 Note",
	'x-rpc-app_id': "1953439974",
	'Referer': 'https://app.mihoyo.com',
	'Host': 'api-cloudgame.mihoyo.com',
	'Connection': 'Keep-Alive',
	'Accept-Encoding': 'gzip',
	'User-Agent': 'okhttp/4.9.0'
};

export async function getWalletURL(): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: WalletURL,
			headers: {
				...HEADERS,
			}
		} )
			.then( ( result ) => {
				resolve( result );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getAnnouncementURL(): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: AnnouncementURL,
			headers: {
				...HEADERS,
			}
		} )
			.then( ( result ) => {
				resolve( result );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}

export async function getNotificationURL(): Promise<any> {
	return new Promise( ( resolve, reject ) => {
		request( {
			method: "GET",
			url: NotificationURL,
			headers: {
				...HEADERS,
			}
		} )
			.then( ( result ) => {
				resolve( result );
			} )
			.catch( ( reason ) => {
				reject( reason );
			} );
	} );
}