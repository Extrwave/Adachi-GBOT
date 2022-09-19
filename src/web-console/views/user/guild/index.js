const template = `<div class="table-container user guild-page">
	<div class="nav-btn-box">
    	<el-scrollbar class="horizontal-wrap">
			<nav-search :searchList="searchList" :searchData="listQuery" :showNum="1" :disabled="tableLoading" @change="handleFilter"></nav-search>
    	</el-scrollbar>
	</div>
    <div class="table-view">
		<el-table v-loading="tableLoading" :data="guildList" header-row-class-name="table-header" :height="tableHeight" stripe border @selection-change="selectionChange">
        	<el-table-column fixed="left" type="selection" width="50" align="center" prop="selection" label="筛选"></el-table-column>
			<el-table-column prop="guildId" label="ID" align="center" min-width="110px"></el-table-column>
			<el-table-column prop="avatar" label="频道" align="center" min-width="230px">
				<template #default="{row}">
					<div class="user-info">
						<img class="user-avatar" :src="row.guildAvatar" alt="ERROR" draggable="false" />
						<span class="user-nickname">{{ row.guildName }}</span>
					</div>
				</template>
			</el-table-column>
			<el-table-column prop="guildAuth" label="权限" align="center" min-width="100px">
				<template #default="{row}">
					<div class="lighter-block" :style="{ 'background-color': authLevel[row.guildAuth - 1].color }">
						<span>{{ authLevel[row.guildAuth - 1].label }}</span>
					</div>
				</template>
			</el-table-column>
			<el-table-column prop="guildAuth" label="频道身份" align="center" min-width="100px">
				<template #default="{row}">
					<div class="lighter-block" :style="{ 'background-color': getRole(row.guildRole).color }">
						<span>{{ getRole(row.guildRole).label }}</span>
					</div>
				</template>
			</el-table-column>
			<el-table-column prop="setting" label="操作" align="center" min-width="85px">
				<template #default="{row}">
    	      		<el-button type="text" @click="openGuildModal(row)">编辑</el-button>
				</template>
			</el-table-column>
		</el-table>
		<el-pagination
			v-model:current-page="currentPage"
			layout="prev, pager, next"
			:page-size="pageSize"
			:pager-count="7"
			:total="totalGuild"
			@current-change="getGuildData"></el-pagination>
	</div>
	<guild-detail
		ref="guildDetailRef"
		:guild-info="selectGuild"
		:cmdKeys="cmdKeys"
		:auth-level="authLevel"
		@close-dialog="resetCurrentData"
		@reload-data="getGuildData"
	></guild-detail>
</div>`;

import $http from "../../../api/index.js";
import { formatRole } from "../../../utils/format.js";
import NavSearch from "../../../components/nav-search/index.js";
import GuildDetail from "./guild-detail.js";

const { defineComponent, reactive, onMounted, computed, ref, toRefs, inject } = Vue;
const { ElNotification, ElMessageBox } = ElementPlus;

export default defineComponent( {
	name: "Guild",
	template,
	components: {
		NavSearch,
		GuildDetail
	},
	setup() {
		const state = reactive( {
			guildList: [],
			cmdKeys: [],
			currentPage: 1,
			pageSize: 14,
			totalGuild: 0,
			tableLoading: false,
			showGuildModal: false,
			selectGuild: {},
			// 所选列表数组
			selectionList: []
		} );
		
		const guildDetailRef = ref( null );
		
		const { device, deviceWidth, deviceHeight, showTab } = inject( "app" );
		
		const searchList = ref( [
			{ id: "guildId", name: "频道ID", type: "input" }
		] );
		
		const listQuery = reactive( {
			guildId: ""
		} )
		
		const authLevel = [ {
			label: "禁用",
			color: "#727272",
			value: 1
		}, {
			label: "正常",
			color: "#55db2c",
			value: 2
		} ];
		
		const tableHeight = computed( () => {
			return `${ deviceHeight.value - ( device.value === "mobile" ? 240 : 240 ) - ( showTab.value ? 40 : 0 ) }px`;
		} );
		
		onMounted( () => {
			getGuildData();
		} )
		
		/* 群身份信息 */
		function getRole( role ) {
			return formatRole( role ) || {
				label: "未知",
				color: "#999"
			};
		}
		
		function getGuildData() {
			state.tableLoading = true;
			$http.GUILD_LIST( {
				page: state.currentPage,
				length: state.pageSize,
				...listQuery
			}, "GET" ).then( resp => {
				state.guildList = resp.data.guildInfos;
				state.cmdKeys = resp.data.cmdKeys;
				state.totalGuild = resp.total;
				state.tableLoading = false;
			} ).catch( error => {
				state.tableLoading = false;
			} );
		}
		
		/* 筛选条件变化查询 */
		async function handleFilter() {
			state.currentPage = 1;
			await getGroupData();
		}
		
		
		function selectionChange( val ) {
			state.selectionList = val
		}
		
		function openGuildModal( row ) {
			state.selectGuild = JSON.parse( JSON.stringify( row ) );
			guildDetailRef.value.openModal();
		}
		
		function resetCurrentData() {
			state.selectGuild = {};
		}
		
		
		return {
			...toRefs( state ),
			guildDetailRef,
			tableHeight,
			deviceWidth,
			deviceHeight,
			searchList,
			listQuery,
			authLevel,
			getRole,
			getGuildData,
			selectionChange,
			openGuildModal,
			handleFilter,
			resetCurrentData
		};
	}
} );