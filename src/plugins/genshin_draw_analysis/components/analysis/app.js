const template =
	`<div class="main2">
	<span class="header">UID{{uid}}的抽卡记录分析</span>
	<div class="main">
		<div class="item">
			<span class="title">角色活动祈愿</span>
			<div id="up-role" style="width:400px;height:400px;"></div>
			<span class="time">{{info["301"].time}}</span>
			<div class="info">
				<span class="total">总计 <span class="lj">{{ info["301"].total }}</span> 抽 已累计 <span class="wc">{{info["301"].wc}}</span> 抽未出5星</span>
				<span class="five">5星：{{info["301"].w5+info["301"].j5}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{{info["301"].lv5}}]</span>
				<span class="four">4星：{{info["301"].w4+info["301"].j4}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{{info["301"].lv4}}]</span>
				<span class="third">3星：{{info["301"].w3}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{{info["301"].lv3}}]</span>
				<div class="jl">
					<span>5星历史记录：</span>
					<span v-for="el in info['301'].history" class="jl2">
						<span :style="{'color': getColor(el.name)}">{{el.name}}[{{el.count}}]&nbsp;</span>
					</span>
				</div>
				<span class="total">5星平均出货次数为：<span class="per">{{info["301"].per}}</span></span>
			</div>
		</div>
		<div class="item">
			<span class="title">武器活动祈愿</span>
			<div id="up-arms" style="width:400px;height:400px;"></div>
			<span class="time">{{info["302"].time}}</span>
			<div class="info">
				<span class="total">总计 <span class="lj">{{ info["302"].total }}</span> 抽 已累计 <span class="wc">{{info["302"].wc}}</span> 抽未出5星</span>
				<span class="five">5星：{{info["302"].w5+info["302"].j5}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{{info["302"].lv5}}]</span>
				<span class="four">4星：{{info["302"].w4+info["302"].j4}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{{info["302"].lv4}}]</span>
				<span class="third">3星：{{info["302"].w3}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{{info["302"].lv3}}]</span>
				<div class="jl">
					<span>5星历史记录：</span>
					<span v-for="el in info['302'].history" class="jl2">
						<span :style="{'color': getColor(el.name)}">{{el.name}}[{{el.count}}]&nbsp;</span>
					</span>
				</div>
				<span class="total">5星平均出货次数为：<span class="per">{{info["302"].per}}</span></span>
			</div>
		</div>
		<div class="item">
			<span class="title">常驻祈愿</span>
			<div id="permanent" style="width:400px;height:400px;"></div>
			<span class="time">{{info["200"].time}}</span>
			<div class="info">
				<span class="total">总计 <span class="lj">{{ info["200"].total }}</span> 抽 已累计 <span class="wc">{{info["200"].wc}}</span> 抽未出5星</span>
				<span class="five">5星：{{info["200"].w5+info["200"].j5}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{{info["200"].lv5}}]</span>
				<span class="four">4星：{{info["200"].w4+info["200"].j4}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{{info["200"].lv4}}]</span>
				<span class="third">3星：{{info["200"].w3}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{{info["200"].lv3}}]</span>
				<div class="jl">
					<span>5星历史记录：</span>
					<span v-for="el in info['200'].history" class="jl2">
						<span :style="{'color': getColor(el.name)}">{{el.name}}[{{el.count}}]&nbsp;</span>
					</span>
				</div>
				<span class="total">5星平均出货次数为：<span class="per">{{info["200"].per}}</span></span>
			</div>
			
		</div>
		<div class="item">
			<span class="title">新手祈愿</span>
			<div id="novice" style="width:400px;height:400px;"></div>
			<span class="time">{{info["100"].time}}</span>
			<div class="info">
				<span class="total">总计 <span class="lj">{{ info["100"].total }}</span> 抽 已累计 <span class="wc">{{info["100"].wc}}</span> 抽未出5星</span>
				<span class="five">5星：{{info["100"].w5+info["100"].j5}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{{info["100"].lv5}}]</span>
				<span class="four">4星：{{info["100"].w4+info["100"].j4}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{{info["100"].lv4}}]</span>
				<span class="third">3星：{{info["100"].w3}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[{{info["100"].lv3}}]</span>
				<div class="jl">
					<span>5星历史记录：</span>
					<span v-for="el in info['100'].history" class="jl2">
						<span :style="{'color': getColor(el.name)}">{{el.name}}[{{el.count}}]&nbsp;</span>
					</span>
				</div>
				<span class="total">5星平均出货次数为：<span class="per">{{info["100"].per}}</span></span>
			</div>
		</div>
	</div>
	<div class="footer">Create by lishengqunchn © lishengqun.com</div>
</div>`;

const { defineComponent } = Vue;

export default defineComponent( {
	name: "AnalysisApp",
	template,
	components: {},
	mounted() {
		let that = this;
		let data = that.info;
		let keys = Object.keys( this.info );
		for ( let index = 0; index < keys.length; index++ ) {
			const element = keys[index];
			let key = parseInt( element );
			switch ( key ) {
				case 100:
					if ( data[element].total == 0 ) {
						break;
					}
					// 初始化图表标签
					const myChart100 = echarts.init( document.getElementById( 'novice' ) );
					const options100 = {
						legend: {
							// Try 'horizontal'
							orient: 'vertical',
							right: 10,
							top: 'center',
							data: [ '五星角色', '五星武器', '四星角色', '四星武器', '三星武器' ]
						},
						series: [ {
							type: 'pie',
							stillShowZeroSum: false,
							radius: '50%',
							data: [
								{
									value: data[element].j5,
									name: '五星角色'
								},
								{
									value: data[element].w5,
									name: '五星武器'
								},
								{
									value: data[element].j4,
									name: '四星角色'
								},
								{
									value: data[element].w4,
									name: '四星武器'
								},
								{
									value: data[element].w3,
									name: '三星武器'
								}
							]
						} ]
					};
					myChart100.setOption( options100 );
					break;
				case 301:
					if ( data[element].total == 0 ) {
						break;
					}
					// 初始化图表标签
					const myChart301 = echarts.init( document.getElementById( 'up-role' ), null, { renderer: 'svg' } );
					const options301 = {
						legend: {
							orient: 'horizontal',
							top: 20,
							data: [ '五星角色', '五星武器', '四星角色', '四星武器', '三星武器' ]
						},
						series: [ {
							type: 'pie',
							stillShowZeroSum: false,
							radius: '50%',
							data: [
								{
									value: data[element].j5,
									name: '五星角色'
								},
								{
									value: data[element].j4,
									name: '四星角色'
								},
								{
									value: data[element].w4,
									name: '四星武器'
								},
								{
									value: data[element].w3,
									name: '三星武器'
								}
							]
						} ]
					};
					myChart301.setOption( options301 );
					break;
				case 302:
					if ( data[element].total == 0 ) {
						break;
					}
					// 初始化图表标签
					const myChart302 = echarts.init( document.getElementById( 'up-arms' ) );
					const options302 = {
						legend: {
							orient: 'horizontal',
							top: 20,
							data: [ '五星角色', '五星武器', '四星角色', '四星武器', '三星武器' ]
						},
						series: [ {
							type: 'pie',
							stillShowZeroSum: false,
							radius: '50%',
							data: [
								{
									value: data[element].w5,
									name: '五星武器'
								},
								{
									value: data[element].j4,
									name: '四星角色'
								},
								{
									value: data[element].w4,
									name: '四星武器'
								},
								{
									value: data[element].w3,
									name: '三星武器'
								}
							]
						} ]
					};
					myChart302.setOption( options302 );
					break;
				case 200:
					if ( data[element].total == 0 ) {
						break;
					}
					// 初始化图表标签
					const myChart200 = echarts.init( document.getElementById( 'permanent' ) );
					const options200 = {
						legend: {
							orient: 'horizontal',
							top: 20,
							data: [ '五星角色', '五星武器', '四星角色', '四星武器', '三星武器' ]
						},
						series: [ {
							type: 'pie',
							stillShowZeroSum: false,
							radius: '50%',
							data: [
								{
									value: data[element].j5,
									name: '五星角色'
								},
								{
									value: data[element].w5,
									name: '五星武器'
								},
								{
									value: data[element].j4,
									name: '四星角色'
								},
								{
									value: data[element].w4,
									name: '四星武器'
								},
								{
									value: data[element].w3,
									name: '三星武器'
								}
							]
						} ]
					};
					myChart200.setOption( options200 );
					break;
				default:
					break;
			}
		}
	},
	setup() {
		const urlParams = parseURL( location.search );
		const data = request( `/api/analysis/result?uid=${ urlParams.uid }` );
		let data2 = {};
		const result = JSON.parse( data.data );
		let uid = "";
		for ( let index = 0; index < result.length; index++ ) {
			const element = result[index];
			let total = element.data.length;
			let total5 = 0;
			element.data.sort( sortData );
			let w5 = 0;
			let j5 = 0;
			let w4 = 0;
			let j4 = 0;
			let w3 = 0;
			let count = 1;//出五星计数
			let arr5 = [];
			let index5 = 0;
			for ( let index = 0; index < total; index++ ) {
				const item = element.data[index];
				uid = item.uid;
				if ( item.rank_type === "3" && item.item_type === '武器' ) {
					w3++;
				}
				if ( item.rank_type === "4" && item.item_type === '武器' ) {
					w4++;
				}
				if ( item.rank_type === "5" && item.item_type === '武器' ) {
					w5++;
					arr5.push( { count, name: item.name } );
					total5 += count;
					count = 0;
					index5 = index;
				}
				
				if ( item.rank_type === "5" && item.item_type === '角色' ) {
					j5++;
					total5 += count;
					arr5.push( { count, name: item.name } );
					count = 0;
					index5 = index;
				}
				
				if ( item.rank_type === "4" && item.item_type === '角色' ) {
					j4++;
				}
				count++;
			}
			data2[element.key] = {
				w5,
				j5,
				j4,
				w4,
				w3,
				history: arr5,
				per: total5 === 0 ? 0 : ( total5 / ( w5 + j5 ) ).toFixed( 2 ),
				total,
				wc: total > 0 ? ( total - index5 - 1 ) : 0,
				lv5: total === 0 ? ( 0 + '%' ) : ( ( ( w5 + j5 ) / total * 100 ).toFixed( 2 ) + '%' ),
				lv4: total === 0 ? ( 0 + '%' ) : ( ( ( w4 + j4 ) / total * 100 ).toFixed( 2 ) + '%' ),
				lv3: total === 0 ? ( 0 + '%' ) : ( ( ( w3 ) / total * 100 ).toFixed( 2 ) + '%' ),
				time: total > 0 ? `${ element.data[0].time.split( " " )[0] }  ~  ${ element.data[total - 1].time.split( " " )[0] }` : ""
			}
		}
		
		const getColor = function ( name ) {
			let index = getRandomNum( 0, colors.length - 1 );
			if ( nameColor[name] ) {
				return nameColor[name];
			}
			//颜色用尽 返回默认颜色
			if ( Object.keys( usedColor ).length >= colors.length ) {
				return "#800000";
			}
			let color = colors[index];
			while ( usedColor[color] ) {
				index = getRandomNum( 0, colors.length - 1 );
				color = colors[index];
			}
			usedColor[color] = 1;
			nameColor[name] = color;
			return color;
		}
		return {
			info: data2,
			uid,
			getColor
		}
	}
} );

//颜色池
const colors = [
	"orange", "#EA0000", "#FF359A", "#FF00FF", "#9F35FF", "#2828FF", "#0072E3", "#00CACA", "#02DF82", "#00BB00", "#82D900", "#EA7500", "#F75000",
	"#AD5A5A", "#5151A2", "#8F4586", "#FFB6C1", "#FF6EB4", "#DC143C", "#DB7093", "#FF69B4", "#FF1493", "#C71585", "#DA70D6", "#D8BFD8", "#DDA0DD",
	"#EE82EE", "#8B008B", "#800080", "#BA55D3", "#9400D3", "#9932CC", "#4B0082", "#8A2BE2", "#9370DB", "#7B68EE", "#6A5ACD", "#483D8B", "#87CEFF",
	"#00BFFF", "#5F9EA0", "#00CED1", "#008B8B", "#00FA9A", "#00FF00", "#9999FF", "#FFA500", "#DAA520", "#4169E1", "#FF8C00", "#F4A460", "#D2691E",
	"#FF6600", "#8B4513", "#FFA07A", "#FF7F50", "#FF4500", "#E9967A", "#FF6347", "#FA8072", "#F08080", "#B22222"
]
let usedColor = {}
let nameColor = {}