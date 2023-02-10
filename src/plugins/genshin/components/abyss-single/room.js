const template = `<div class="room">
	<header class="room-header">
		<span class="room-title">第{{ ["一", "二", "三"][data.index - 1] }}间</span>
		<span class="room-date">{{ stamp2date }}</span>
	</header>
	<article class="room-content">
		<template v-if="!isEmpty">
			<ul class="chara-list">
				<li v-for="(b, bKey) of data.battles">
					<div v-for="(c, cKey) of b.avatars" :key="cKey" class="chara-box">
						<span>{{ c.level }}</span>
						<img :src="getSideIcon(c.id)" alt="ERROR">
					</div>
				</li>
			</ul>
			<div class="star-box">
				<img v-for="(s, sKey) of data.maxStar" :key="sKey" :class="{'star-crush': s > data.star}" src="https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/abyss/star.png" alt="ERROR" />
			</div>
		</template>
		<p v-else class="empty-massage">暂无挑战数据</p>
	</article>
</div>`;

const { defineComponent, computed } = Vue;

export default defineComponent( {
	name: "Room",
	props: {
		data: {
			type: Object,
			default: () => ( {
				index: 0,
				battles: []
			} )
		}
	},
	template,
	setup( props ) {
		const data = props.data;
		
		/* 是否为空数据 */
		const isEmpty = computed( () => !data?.battles || !data?.battles.length );
		
		/* 获取当前时间 */
		const stamp2date = computed( () => {
			if ( isEmpty.value ) return "";
			const date = new Date( parseInt( props.data.battles[0].timestamp ) * 1000 );
			return date.toLocaleDateString().replace( /\//g, "-" ) + " " + date.toTimeString().split( " " )[0];
		} );
		
		/* 获取角色小头 */
		const getSideIcon = code => `https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/sides/${ code }.png`;
		
		return {
			isEmpty,
			stamp2date,
			getSideIcon
		};
	}
} )