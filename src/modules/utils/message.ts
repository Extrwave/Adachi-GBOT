/**
Author: Ethereal
CreateTime: 2022/7/1
由于官方SDK更新滞后，与最新API部分数据不匹配，此文件用于修正
 */

import {
	IMessage, IUser,
	MessageReference, MessageToCreate
} from "qq-guild-bot";
import FormData from "form-data";
import { Markdown } from "@modules/utils/markdown";
import { Keyboard } from "@modules/utils/keyboard";

/* ws监听到消息的类型 */
export interface Message {
	eventType: string,
	eventId: string,
	msg: Msg
}


/* 此处是SDK摆烂没更新的部分 */
export interface Msg extends IMessage {
	direct_message: boolean,
	src_guild_id: string,
	message_reference?: MessageReference
}

/* 监听到成员变动消息的类型 */
export interface MemberMessage {
	eventType: string,
	eventId: string,
	msg: {
		guild_id: string,
		joined_at: string,
		nick: string,
		op_user_id: string,
		roles: [],
		user: IUser
	}
}

/* BOT进入退出新旧频道监听事件 */
export interface GuildsMove {
	eventType: string,
	eventId: string,
	msg: {
		description: string,
		icon: string,
		id: string,
		joined_at: string,
		max_members: number,
		member_count: number,
		name: string,
		op_user_id: string,
		owner: true,
		owner_id: string,
		union_appid: string,
		union_org_id: string,
		union_world_id: string
	}
}


export enum MessageScope {
	Neither,
	Guild = 1 << 0,
	Private = 1 << 1,
	Both = Guild | Private
}

export enum MessageType {
	Guild,
	Private,
	Unknown
}

export interface MessageToSend extends MessageToCreate {
	file_image?: string | {
		data: string,
		type: string
	}
	markdown?: Markdown;
	keyboard?: Keyboard
}

interface MessageNormal {
	type: "normal",
	data: MessageToSend
}

interface MessageFormData {
	type: "formData",
	data: FormData
}

export type MessageEntity = MessageNormal | MessageFormData;

/* SDK 消息其他返回类型 */
export interface OthMessage {
	code: number,
	message: string,
	traceid: string,
	data: {
		message_audit: {
			audit_id: string
		}
	}
}

export interface ErrorMsg {
	code: number,
	message: string,
	traceid: string
}