import { getWalletURL } from "./api"
import { InputParameter } from "@modules/command";
import { getHeaders } from "#yyscloud/util/header";

//redis保存用户信息
export async function savaUserData( token: string, i: InputParameter ) {
	const dbKey = "extr-wave-yys-sign." + i.messageData.msg.author.id;
	await i.redis.setHashField( dbKey, "token", token );
	await i.redis.setHashField( dbKey, "device_name", getDevice( "name" ) );
	await i.redis.setHashField( dbKey, "device_model", getDevice( "model" ) );
	await i.redis.setHashField( dbKey, "device_id", getDevice( "id" ) );
}

//检查token有效性
export async function checkToken( userId: string ) {
	//获取用户信息填充header
	const headers = await getHeaders( userId );
	const message = await getWalletURL( headers );
	const data = JSON.parse( message );
	return data.retcode === 0 && data.message === "OK";
}

//获取固定设备名称（后面也许会添加其他？？？）
function getDevice( type: string ) {
	// const phone = [ "Realme X7 Pro", "Apple iPhone 11 Pro", "HUAWEI P40 Pro" ];
	// let index: number = Math.round( Math.random() * phone.length - 1 );
	
	let name = "Realme X7 Pro";
	let model = "X7 Pro";
	if ( type === "name" )
		return name;
	else if ( type === "model" )
		return model;
	else
		return getUUID();
}

//获取随机设备ID
function getUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function ( c ) {
		let r = Math.random() * 16 | 0, v = c == 'x' ? r : ( r & 0x3 | 0x8 );
		return v.toString( 16 );
	} );
}

