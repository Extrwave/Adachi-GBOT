const template = `<el-dialog v-model="showModal" custom-class="user-detail-dialog no-header" @closed="closeModal" draggable>
	<div class="dialog-body user-detail">
		<div class="section-info">
			<p class="title">信息面板</p>
			<div class="user-base-info">
				<img class="avatar" :src="userInfo.avatar" alt="ERROR" draggable="false" />
				<div class="public-info">
					<p class="user-id">
						<span class="label">用户账号</span>
						<span>{{ userInfo.userID }}</span>
					</p>
					<p class="nickname">
						<span class="label">用户昵称</span>
						<span>{{ userInfo.nickname }}</span>
					</p>
					<p class="nickname">
						<span class="label">权限等级</span>
						<span>{{ authLevel[userInfo.botAuth]?.label }}</span>
					</p>
				</div>
			</div>
		</div>
		<div class="section-info">
			<p class="title">指令使用分布</p>
			<el-scrollbar class="group-info" wrap-class="scrollbar-wrapper">
				<p v-for="(el, elKey) in userInfo.groupInfoList" :key="elKey">{{ getUsedInfo(el) }}</p>
			</el-scrollbar>
		</div>
		<div class="section-info">
			<p class="title">禁用指令列表</p>
			<el-scrollbar class="limit-info" wrap-class="scrollbar-wrapper">
				<ul class="limit-list">
					<template v-if="management.limits?.length" >
						<li v-for="(l, lKey) of management.limits" :key="lKey">{{ l.key }} - {{l.guild}}</li>
					</template>
					<li class="limit-empty" v-else>该用户可以使用全部指令</li>
				</ul>
			</el-scrollbar>
		</div>
		<div class="section-info">
			<p class="title">订阅列表</p>
			<el-scrollbar class="sub-info" wrap-class="scrollbar-wrapper">
				<ul class="sub-list">
					<template v-if="userInfo.subInfo?.length" >
						<li v-for="(s, sKey) of userInfo.subInfo" :key="sKey">{{ s }}</li>
					</template>
					<li class="sub-empty" v-else>该用户暂未使用订阅服务</li>
				</ul>
			</el-scrollbar>
		</div>
		<div class="section-info">
			<p class="title">管理面板</p>
			<ul class="management-info">
				<li class="auth-management article-item">
					<p class="label">权限设置</p>
					<div class="content">
						<el-radio-group v-model="management.auth" :disabled="userInfo.botAuth === 5" >
							<el-radio-button
								v-for="a of authLevel"
								:key="a.value"
								:style="{ 'background-color': a.color }"
								:label="a.value"
								:disabled="a.value === 5"
								>{{ a.label }}
							</el-radio-button>
						</el-radio-group>
					</div>
				</li>
				<li class="limit-management article-item">
					<p class="label">指令权限</p>
					<div class="content">
						<el-select v-model="currentKey" placeholder="选择指令Key" :disabled="management.auth === 5" @change="changeCurrentKey" >
						    <el-option class="limit-key-dropdown-item" v-for="(c, cKey) of cmdKeys" :key="cKey" :value="c" />
						</el-select>
						<el-select v-model="currentGuild" placeholder="选择频道" :disabled="management.auth === 5" @change="changeCurrentGuild" >
						    <el-option class="limit-key-dropdown-item" v-for="(c, cKey) of userInfo.guildUsed" :key="cKey" :value="c" />
						</el-select>
				    	<el-radio-group v-model="keyStatus" :disabled="!currentKey ||!currentGuild || management.auth === 5" @change="changeKeyStatus" >
							<el-radio-button :label="1">ON</el-radio-button>
							<el-radio-button :label="2">OFF</el-radio-button>
						</el-radio-group>
					</div>
				</li>
			</ul>
			<el-button class="save" @click="postChange" round>保存设置</el-button>
		</div>
	</div>
</el-dialog>`;

import $http from "../../../api/index.js";
import { formatRole } from "../../../utils/format.js";

const { defineComponent, reactive, toRefs, watch } = Vue;
const { ElMessage } = ElementPlus;

export default defineComponent( {
	name: "UserDetail", template, emits: [ "reloadData", "closeDialog" ], props: {
		userInfo: {
			type: Object, default: () => ( {} )
		}, authLevel: {
			type: Array, default: () => []
		}, cmdKeys: {
			type: Array, default: () => []
		}
	}, setup( props, { emit } ) {
		const state = reactive( {
			management: {
				auth: 0, limits: []
			}, current: {
				currentKey: "", currentGuild: ""
			}, keyStatus: 0, showModal: false
		} );
		
		/* 填充管理字段对象 */
		watch( () => props.userInfo, ( val ) => {
			if ( Object.keys( val ).length !== 0 ) {
				state.current.currentKey = "";
				state.current.currentGuild = "";
				state.keyStatus = 0;
				state.management.auth = val.botAuth;
				state.management.limits = val.limits ? val.limits : [];
			}
		}, { immediate: true, deep: true } )
		
		/* 获得地区分布展示内容 */
		function getUsedInfo( el ) {
			if ( typeof el === "string" ) {
				return el;
			}
			return `频道 ${ el.guild_name } - [${ formatRole( el.auth )?.label }] ${ el.nickname }`;
		}
		
		/* 根据切换到的 key 更改按钮状态 */
		function changeCurrentKey( key ) {
			state.currentKey = key;
		}
		
		function changeCurrentGuild( key ) {
			state.currentGuild = key;
			state.keyStatus = key ? state.management.limits.includes( {
				key: state.currentKey, guild: state.currentGuild
			} ) ? 2 : 1 : 0;
		}
		
		function changeKeyStatus( status ) {
			const limit = {
				key: state.currentKey, guild: state.currentGuild
			};
			/* 当切换为 on 并 limit 数组中存在该key时，移除 */
			if ( status === 1 && state.management.limits.includes( limit ) ) {
				state.management.limits.splice( state.management.limits.findIndex( el => {
					return el.currentKey === state.currentKey && el.currentGuild === state.currentGuild
				} ), 1 );
			}
			/* 当切换为 off 并 limit 数组中不存在该key时，添加 */
			if ( status === 2 && !state.management.limits.includes( limit ) ) {
				state.management.limits.push( limit );
			}
		}
		
		function postChange() {
			$http.USER_SET( {
				target: props.userInfo.userID,
				auth: state.management.auth,
				limits: JSON.stringify( state.management.limits )
			}, "POST" ).then( () => {
				ElMessage.success( "设置保存成功" );
				state.showModal = false;
				emit( "reloadData" );
			} ).catch( () => {
				ElMessage.error( "设置保存失败" );
			} );
		}
		
		function openModal() {
			state.showModal = true;
		}
		
		function closeModal() {
			emit( "closeDialog" );
		}
		
		return {
			...toRefs( state ),
			postChange,
			getUsedInfo,
			changeCurrentKey,
			changeCurrentGuild,
			changeKeyStatus,
			openModal,
			closeModal
		};
	}
} );