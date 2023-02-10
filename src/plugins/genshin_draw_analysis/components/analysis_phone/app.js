const template = `<div class="main">
	<div class="title">祈愿分析|UID{{uid}}</div>
	<div class="box">
            <BoxItem v-for="(val, key, index) in info" :data="val" :key="key"/>
    </div>
	<div class="footer">Modify by Adachi-GBOT & lishengqunchn © lishengqun.com</div>
</div>`;

const { defineComponent } = Vue;
import BoxItem from "./item.js";

export default defineComponent( {
	name: "AnalysisPhoneApp", template, components: {
		BoxItem
	}, mounted() {
	}, setup() {
		const cardPool = { '301': '限定池', '302': '武器池', '200': '常驻池', '100': '新手池' };
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
			let zo = {};
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
					arr5.push( { count, name: item.name, type: '武器' } );
					total5 += count;
					if ( !zo.count || zo.count > count ) {
						zo = { count, name: item.name, type: '武器' }
					}
					count = 0;
					index5 = index;
				}
				
				if ( item.rank_type === "5" && item.item_type === '角色' ) {
					j5++;
					total5 += count;
					arr5.push( { count, name: item.name, type: '角色' } );
					if ( !zo.count || zo.count > count ) {
						zo = { count, name: item.name, type: '角色' }
					}
					count = 0;
					index5 = index;
				}
				
				if ( item.rank_type === "4" && item.item_type === '角色' ) {
					j4++;
				}
				count++;
			}
			if ( total === 0 ) {
				continue;
			}
			data2[element.key] = {
				name: cardPool[element.key],
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
				time: total > 0 ? `${ element.data[0].time.split( " " )[0] }  ~  ${ element.data[total - 1].time.split( " " )[0] }` : "",
				zo
			}
		}
		
		return {
			info: data2, uid
		}
	}
} );