const template = `<el-dialog v-model="showModal" custom-class="guild-detail-dialog no-header" @closed="closeModal" draggable>
	<div class="dialog-body user-detail">
		<div class="section-info">
			<p class="title">信息面板</p>
			<div class="user-base-info">
				<img class="avatar" :src="guildInfo.guildAvatar" alt="ERROR" draggable="false" />
				<div class="public-info">
					<p class="user-id">
						<span class="label">频道ID</span>
						<span>{{ guildInfo.guildId }}</span>
					</p>
					<p class="nickname">
						<span class="label">频道名字</span>
						<span>{{ guildInfo.guildName }}</span>
					</p>
					<p class="auth">
						<span class="label">权限等级</span>
						<span>{{ authLevel[guildInfo.guildAuth -1]?.label }}</span>
					</p>
					<p class="role">
						<span class="label">频道身份</span>
						<span :style="{ color: role.color }" >{{ role.label }}</span>
					</p>
				</div>
			</div>
		</div>
		<div class="section-info">
			<p class="title">管理面板</p>
			<ul class="management-info">
				<li class="auth-management article-item">
					<p class="label">权限设置</p>
					<div class="content">
						<el-radio-group v-model="management.auth" >
							<el-radio-button
								v-for="a of authLevel"
								:key="a.value"
								:style="{ 'background-color': a.color }"
								:label="a.value"
								>{{ a.label }}
							</el-radio-button>
						</el-radio-group>
					</div>
				</li>
			</ul>
			<el-button class="save" @click="postChange" round>保存设置</el-button>
		</div>
	</div>
</el-dialog>`;

import $http from "../../../api/index.js"
import { formatRole } from "../../../utils/format.js";

const { defineComponent, reactive, toRefs, watch } = Vue;
const { ElMessage } = ElementPlus;

export default defineComponent( {
	name: "GuildDetail",
	template,
	emits: [ "reloadData", "closeDialog" ],
	props: {
		guildInfo: {
			type: Object,
			default: () => ( {} )
		},
		authLevel: {
			type: Array,
			default: () => []
		},
	},
	setup( props, { emit } ) {
		const state = reactive( {
			role: {
				label: "未知",
				color: "#999"
			},
			management: {
				auth: 0,
			},
			showModal: false
		} );
		
		/* 填充管理字段对象 */
		watch( () => props.guildInfo, val => {
			if ( Object.keys( val ).length !== 0 ) {
				state.role = formatRole( val.guildAuth ) || {
					label: "未知",
					color: "#999"
				};
				state.management.auth = val.guildAuth;
			}
		}, { immediate: true, deep: true } )
		
		
		function postChange() {
			$http.GUILD_SET( {
				target: props.guildInfo.guildId,
				auth: state.management.auth,
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
			openModal,
			closeModal
		};
	}
} );