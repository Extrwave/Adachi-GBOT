const template =
	`<div class="box-item">
    <div class="title2">{{ data.name }}</div>
	<div class="info">
		<div class="info-item">
			<span class="info-item-num">{{ data.total }}</span>
			<span class="info-item-ms">总计已抽</span>
		</div>
		<div class="info-item">
			<span class="info-item-num" style="color: red">{{ data.wc }}</span>
			<span class="info-item-ms">未出五星</span>
		</div>
		<div class="info-item">
			<span class="info-item-num" style="color: red">{{data.w5+data.j5}}</span>
			<span class="info-item-ms">五星总计</span>
		</div>
		<div class="info-item">
			<span class="info-item-num" style="color: red">{{ data.lv5 }}</span>
			<span class="info-item-ms">五星占比</span>
		</div>
		<div class="info-item">
			<span class="info-item-num" style="color: red">{{ data.per }}</span>
			<span class="info-item-ms">五星平均</span>
		</div>
		<div class="info-item">
			<span class="info-item-num">{{data.w4+data.j4}}</span>
			<span class="info-item-ms">四星总计</span>
		</div>
		<div class="info-item">
			<span class="info-item-num">{{ data.lv4 }}</span>
			<span class="info-item-ms">四星占比</span>
		</div>
		<div class="info-item">
			<span class="info-item-num">{{data.w3}}</span>
			<span class="info-item-ms">三星总计</span>
		</div>
		<div class="info-item">
			<span class="info-item-num">{{ data.lv3 }}</span>
			<span class="info-item-ms">三星占比</span>
		</div>
		<div class="info-item">
			<span class="info-item-num" style="color: red">{{ data.zo.name || '暂无' }}</span>
			<span class="info-item-ms">最欧五星</span>
		</div>
		<div class="fg">
			<div class="fg-head"></div>
			<div class="fg-content"></div>
			<div class="fg-footer"></div>
		</div>
		<div class="character">
            <Character v-for="el in data.history" :data="el"/>
    	</div>
	</div>
</div>`;

const { defineComponent, computed } = Vue;
import Character from "./character.js";

export default defineComponent( {
	name: "BoxItem",
	template,
	props: {
		data: Object
	},
	components: {
		Character
	},
	setup( props ) {
	}
} );