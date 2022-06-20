const template =
	`<div class="daily">
	<div class="outer">
		<img v-for="i in 4" :src="starBASE64" class="corner-star" :class="'star' + i" alt="ERROR"/>
		<div v-for="i in 4" class="outer-circle" :class="'outer-circle' + i"></div>
		<div class="inner">
			<div v-for="i in 4" class="inner-circle" :class="'inner-circle' + i"></div>
			<div class="content" :class="{ 'has-empty': weapon.length === 0 || character === 0 }">
				<DailyColumn :data="character" type="character"/>
				<DailyColumn :data="weapon" type="weapon"/>
			</div>
		</div>
	</div>
	<p class="author">Modify - Adachi-GBOT</p>
</div>`;

import { parseURL, request } from "../../public/js/src.js";
import DailyColumn from "./column.js";

function parse( obj ) {
	const result = [];
	Object.keys( obj ).forEach( k => {
		const dataList = obj[k];
		const material = JSON.parse( k );
		dataList.sort( ( x, y ) => y.rarity - x.rarity );
		result.push( { ascension: material, list: dataList } );
	} );
	return result;
}

const { defineComponent } = Vue;

export default defineComponent( {
	name: "DailyApp",
	template,
	components: {
		DailyColumn
	},
	setup() {
		const urlParams = parseURL( location.search );
		const data = request( `/api/daily?id=${ urlParams.id }` );
		console.dir( data )
		const weapon = parse( data.weapon );
		const character = parse( data.character );
		
		const starBASE64 = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMjkiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTI4LjU2OCAxNC42MjNjLTkuNzQxLS41NjQtMTIuNjQ0LTMuODg0LTEzLjczNC0xMy43MzQtLjUxNCA5LjkxNy0zLjQxIDEzLjA5Mi0xMy43MzMgMTMuNzM0IDkuOTYzLjM4MyAxMy4wNzkgMy43ODcgMTMuNzMzIDEzLjczNCAxLjE2My05LjUxMSA0LjEyNi0xMi42NDkgMTMuNzM0LTEzLjczNHoiIGZpbGw9IiMyRTNENTQiIHN0cm9rZT0iIzJFM0Q1NCIvPjwvc3ZnPg==";
		
		return {
			weapon,
			character,
			starBASE64
		};
	}
} );