import bot from "ROOT";
import { InputParameter, Order, OrderMatchResult, SwitchMatchResult } from "@modules/command";
import { IChannel } from "qq-guild-bot";
import { Message } from "@modules/utils/message";

/**
Author: Ethereal
CreateTime: 2022/8/6
 */

async function setChannel( guildId: string, channelId: string, match: SwitchMatchResult, messageData: Message ): Promise<string> {
	
	const dbKey = `adachi.channel-limit-${ guildId }`;
	
	if ( match.match.length <= 0 ) {
		if ( messageData.msg.direct_message ) {
			return `私聊使用请指明需要设置的子频道`;
		}
		const channel = await bot.client.channelApi.channel( channelId );
		if ( match.isOn() ) {
			await bot.redis.addSetMember( dbKey, channelId );
			return `已设置可用子频道：<#${ channel.data.id }>`;
		} else {
			await bot.redis.delSetMember( dbKey, channelId );
			return `取消设置可用子频道：<#${ channel.data.id }>`;
		}
	} else {
		const response = await bot.client.channelApi.channels( guildId );
		const allChannels: IChannel[] = response.data;
		const channels = allChannels.filter( value => {
			if ( match.match.includes( `#${ value.name }` ) )
				return true;
		} );
		let msg = match.isOn() ? '已设置可用子频道：\n' : '取消设置可用子频道：\n';
		for ( const value of channels ) {
			if ( match.isOn() ) {
				await bot.redis.addSetMember( dbKey, value.id );
				msg += `\n<#${ value.id }>`;
			} else {
				await bot.redis.delSetMember( dbKey, value.id );
				msg += `\n<#${ value.id }>`;
			}
		}
		return msg;
	}
}

async function cancelChannel( guildId: string ): Promise<string> {
	const dbKey = `adachi.channel-limit-${ guildId }`;
	await bot.redis.deleteKey( dbKey );
	return "当前BOT可在所有子频道使用";
}


export async function main(
	{ sendMessage, messageData, matchResult }: InputParameter ) {
	
	const guildId = messageData.msg.guild_id;
	const channelId = messageData.msg.channel_id;
	
	const header = ( <OrderMatchResult>matchResult ).header;
	if ( header ) {
		const msg = await cancelChannel( guildId );
		await sendMessage( msg );
	} else {
		const match = <SwitchMatchResult>matchResult;
		const msg = await setChannel( guildId, channelId, match, messageData );
		await sendMessage( msg );
	}
}

export async function checkChannelLimit( guildId: string, channelId: string ): Promise<{ status: boolean, msg: string }> {
	const dbKey = `adachi.channel-limit-${ guildId }`;
	const num = await bot.redis.getSetMemberNum( dbKey );
	if ( num > 0 ) {
		const isAllow = await bot.redis.existSetMember( dbKey, channelId );
		if ( !isAllow ) {
			const channel: string[] = await bot.redis.getSet( dbKey );
			let msg = "当前仅可在以下子频道使用本BOT：\n\n";
			channel.forEach( value => {
				msg += `<#${ value }>\n`;
			} );
			return { status: true, msg: msg };
		}
	}
	return { status: false, msg: "" };
}