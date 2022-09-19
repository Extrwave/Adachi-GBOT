/**
Author: Ethereal
CreateTime: 2022/6/19
 */

import { Ark, ArkObj } from 'qq-guild-bot'

export interface MessageArk {
	template_id: string;
	kv: MessageArkKv[];
}

export interface MessageArkKv {
	key: string;
	value?: string;
	obj?: ArkObj[];
}

export function getArkListMessage( desc: string, prompt: string, list: string[] ): Ark {
	let arkMsg: MessageArk = {
		template_id: "23",
		kv: [
			{
				key: "#DESC#",
				value: desc
			},
			{
				key: "#PROMPT#",
				value: prompt
			},
			{
				key: "#LIST#",
				obj: [ {
					obj_kv: [
						{
							key: "desc",
							value: desc
						},
					],
				}, {
					obj_kv: [
						{
							key: "desc",
							value: "\n==============================="
						},
					],
				} ]
			} ]
	};
	list.forEach( value => {
		if ( arkMsg.kv[2].obj ) {
			arkMsg.kv[2].obj.push( { obj_kv: [ { key: "desc", value: value } ] } );
		}
	} )
	return <Ark>arkMsg;
}