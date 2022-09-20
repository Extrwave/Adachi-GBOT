const template = `<div class="table-container fix-height logger">
	<el-scrollbar class="horizontal-wrap">
		<div class="picker">
			<el-date-picker
				v-model="currentDate"
				type="date"
				placeholder="选择日期"
				format="MM-DD"
				:clearable="false"
				:editable="false"
				:disabled-date="disabledDate"
				@change="dateChange"
			/>
			<div v-if="today" class="log-nav-item">
				<span class="content">自动置底</span>
				<el-switch
					v-model="autoBottom"
					active-color="#20a53a"
					inactive-color="#f1f1f1"
				/>
			</div>
			<div class="log-nav-item">
				<el-select v-model="queryParams.logLevel" placeholder="日志等级" @change="handleFilter" @clear="handleFilter" clearable>
    				<el-option v-for="(l, lKey) of logLevel" :key="lKey" :label="l" :value="l"/>
  				</el-select>
			</div>
			<div class="log-nav-item">
				<el-select v-model="queryParams.msgType" placeholder="类型" @change="msgTypeChange" @clear="msgTypeChange" clearable>
    				<el-option v-for="(t, tKey) of msgType" :key="tKey" :label="t.label" :value="t.value"/>
  				</el-select>
			</div>
			<div v-show="queryParams.msgType === 2" class="log-nav-item">
				<el-input v-model="queryParams.guildName" placeholder="输入频道名称" @keydown.enter="handleFilter" @clear="handleFilter" clearable></el-input>
			</div>
			<div class="copy-button" @click="copyAsReportFormat">去隐私复制</div>
		</div>
	</el-scrollbar>
	<div class="log-container">
		<p v-if="currentDate === ''" class="empty-promote">
			请选择日期以查看日志...
		</p>
		<p v-else-if="error" class="empty-promote">
			未找到{{ currentDate.getMonth() + 1 }}月{{ currentDate.getDate() }}日的日志...
		</p>
		<p v-else-if="loading" class="empty-promote">
			正在获取日志记录，请稍后...
		</p>
		<div v-else class="log-window">
			<el-scrollbar ref="scrollbarRef" class="log-scroll-container">
				<p v-for="m in list" class="content-line">
					<span :style="{ color: m.color }">[{{ m.time }}] {{ m.category }} [{{ m.level }}] - </span>
					<span style="color: #fff">{{ m.message }}</span>
				</p>
			</el-scrollbar>
			<el-pagination
				v-model:current-page="currentPage"
				:page-size="pageSize"
				:total="totalLog"
				:pager-count="7"
				layout="prev, pager, next"
				hide-on-single-page
        		@current-change="pageChange"
			/>
		</div>
	</div>
</div>`;

import $http from "../api/index.js";

const { defineComponent, onMounted, computed, reactive, toRefs, watch, ref, nextTick } = Vue;
const { useRoute } = VueRouter;
const { ElMessage } = ElementPlus;

export default defineComponent( {
	name: "Log",
	template,
	setup() {
		let ws = null;
		const route = useRoute();
		const state = reactive( {
			list: [],
			currentDate: new Date(),
			today: true,
			autoBottom: true,
			loading: false,
			error: false,
			currentPage: 1,
			pageSize: 750,
			totalLog: 0
		} );
		
		const logLevel = [ "TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL", "MARK" ];
		
		const msgType = [ {
			label: "系统",
			value: 0
		}, {
			label: "私聊",
			value: 1
		}, {
			label: "群聊",
			value: 2
		} ]
		
		const queryParams = ref( {
			logLevel: "",
			msgType: null,
			guildName: ""
		} )
		
		const scrollbarRef = ref( null );
		
		/* 获取当前最大分页 */
		const pageNum = computed( () => {
			return Math.ceil( state.totalLog / state.pageSize );
		} )
		
		watch( () => route.path, () => {
			if ( ws ) ws.close();
		} );
		
		onMounted( () => {
			state.currentDate = getCurrentDate();
			dateChange( state.currentDate );
		} )
		
		/* 开启 ws 通讯 */
		function runWS() {
			let protocol = document.location.protocol === "https:" ? "wss:" : "ws:";
			ws = new WebSocket( `${ protocol }//${ document.location.host }/ws/log` );
			ws.addEventListener( "message", async ( event ) => {
				const msg = filterWsLogs( JSON.parse( event.data ) );
				if ( msg.length === 0 ) {
					return;
				}
				state.totalLog += msg.length;
				await addMsgToList( msg );
				nextTick( () => {
					if ( state.autoBottom ) {
						scrollToBottom().then( () => {
						} );
					}
				} );
			} );
		}
		
		/* 过滤 ws 传递的 logs 数据 */
		function filterWsLogs( logs ) {
			const logLevel = queryParams.value.logLevel;
			const msgType = parseInt( queryParams.value.msgType );
			const guildName = queryParams.value.guildName;
			return logs.filter( el => {
				/* 过滤日志等级 */
				if ( logLevel && el.level !== logLevel.toUpperCase() ) {
					return false;
				}
				/* 过滤消息类型 */
				if ( !Number.isNaN( msgType ) ) {
					const reg = /\[(G|ID): ((\d|.)+)\]/;
					const result = reg.exec( el.message );
					if ( result ) {
						const type = result[1];
						if ( msgType !== ( type === 'G' ? 2 : 1 ) ) {
							return false;
						}
						if ( msgType === 2 && guildName && guildName !== result[2] ) {
							return false;
						}
					} else if ( msgType !== 0 ) {
						return false;
					}
				}
				return true;
			} );
		}
		
		/* 向列表添加 ws 通讯所得数据，若出现新一页，跳转最新页 */
		async function addMsgToList( msg ) {
			const newPage = state.list.length + msg.length > state.pageSize;
			if ( newPage && state.autoBottom ) {
				await scrollToBottom();
			} else {
				state.list.push( ...msg );
			}
		}
		
		/* 获取日志列表 */
		async function getLogsData( date = state.currentDate ) {
			state.loading = true;
			try {
				const resp = await $http.LOG_INFO( {
					date: date.getTime(),
					page: state.currentPage,
					length: state.pageSize,
					...queryParams.value
				}, "GET" )
				if ( resp.data.length ) {
					state.list = resp.data;
					state.totalLog = resp.total;
					state.error = false;
				} else {
					state.error = true;
				}
				state.loading = false;
			} catch ( error ) {
				state.error = true;
				state.loading = false;
			}
		}
		
		/* 获取当前 年月日 整日期 */
		function getCurrentDate() {
			const date = new Date()
			return new Date( date.getFullYear(), date.getMonth(), date.getDate() )
		}
		
		/* 日期切换 */
		function dateChange( date ) {
			resetData();
			queryParams.value = {
				logLevel: "",
				msgType: null,
				guildName: ""
			}
			
			getLogsData( date ).then( () => {
				state.today = isToday( date );
				if ( state.today && !state.error ) {
					runWS();
					setTimeout( () => scrollToBottom(), 50 );
				} else if ( ws ) {
					ws.close();
				}
			} );
		}
		
		/* 消息类型切换 */
		async function msgTypeChange() {
			queryParams.value.guildName = "";
			await handleFilter();
		}
		
		/* 筛选条件变化查询 */
		async function handleFilter( clearGuildName = false ) {
			resetData();
			await getLogsData();
		}
		
		
		/* 切换分页 */
		async function pageChange( page, isBottom ) {
			if ( !isBottom && scrollbarRef.value ) {
				scrollbarRef.value.wrap$.scrollTop = 0;
			}
			await getLogsData();
		}
		
		/* 滚动至底部 */
		async function scrollToBottom() {
			// 当前不是最后一页时，切换到最后一页并发起分页请求
			if ( state.currentPage !== pageNum.value ) {
				state.currentPage = pageNum.value;
				await pageChange( null, true );
			}
			setTimeout( () => scrollbarRef.value.wrap$.scrollTop = scrollbarRef.value.wrap$.scrollHeight, 10 );
		}
		
		/* 禁选未来时间 */
		function disabledDate( time ) {
			return time.getTime() > Date.now() ||
				time.getTime() < new Date( "2021-11-2" ).getTime();
		}
		
		/* 是否为当天 */
		function isToday( date ) {
			const d = new Date();
			return d.getDate() === date.getDate() &&
				d.getFullYear() === date.getFullYear() &&
				d.getMonth() === date.getMonth();
		}
		
		/* 重置数据 */
		function resetData() {
			state.list = [];
			state.currentPage = 1;
			state.error = false;
		}
		
		/* 去隐私复制 */
		function copyAsReportFormat() {
			const content = getSelection()
				.toString()
				.split( "\n\n" )
				.map( el => {
					el = el.replace( /\[A: (.+)\]\[ID: (\d+)\]/, " [Recv] [Pri-$1]" )
						.replace( /\[A: (.+)\]\[G: (.+)\]/, " [Recv] [Group] $1" )
						.replace( /(\[[A-Z]+]) - (.*)/, "$1 [Event] $2" )
						.replace( /&#93;/g, "]" )
						.replace( /&#91;/g, "[" );
					return el;
				} )
				.join( "\n" );
			if ( content.length === 0 ) {
				ElMessage( {
					message: "请先使用鼠标拖选内容",
					duration: 1500
				} );
				return;
			}
			const textarea = document.createElement( "textarea" );
			textarea.readOnly = true;
			textarea.value = content;
			textarea.style.position = "absolute";
			textarea.style.left = "-9999px";
			document.body.appendChild( textarea );
			textarea.select();
			textarea.setSelectionRange( 0, textarea.value.length );
			document.execCommand( "Copy" );
			document.body.removeChild( textarea );
			ElMessage( {
				message: "内容已复制到剪切板",
				type: "success",
				duration: 1500
			} );
		}
		
		return {
			...toRefs( state ),
			logLevel,
			msgType,
			queryParams,
			scrollbarRef,
			dateChange,
			pageChange,
			msgTypeChange,
			handleFilter,
			disabledDate,
			copyAsReportFormat
		};
	}
} );