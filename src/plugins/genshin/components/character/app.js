const template = `
<div class="character-base">
	<main>
		<div class="portrait-box">
			<img class="portrait" :src="portrait" alt="ERROR">
		</div>
		<span class="uid-box">UID {{ data.uid }}</span>
		<div class="chara-name">
			<img :src="elementIconSrc" alt="ERROR">
			<h3>{{ data.name }}</h3>
			<span>lv{{ data.level }}</span>
			<span>好感度： {{ data.fetter }}</span>
		</div>
		<ScoreChart v-if="showScore && data.score" :data="data.score" :color="chartColor"></ScoreChart>
		<div class="artifact-list">
			<CharacterEquipment v-for="(a, aKey) of artifacts" :key="index" :src="a.icon" :rarity="a.rarity" :level="a.level" :emptyIcon="artifactsFontIcon[aKey]"></CharacterEquipment>
		</div>
		<InfoCard title="套装效果" class="suit-list">
			<template v-if="effectList.length">
				<div v-for="(e, eKey) of effectList" :key="eKey" class="suit-item">
					<CharacterEquipment :src="e.icon"></CharacterEquipment>
					<p class="suit-info">
						<span class="title">{{ e.name }}</span>
						<span class="suit-type">{{ e.num }}件套</span>
					</p>
				</div>
			</template>
			<p v-else>当前没有圣遗物套装效果</p>
		</InfoCard>
		<InfoCard v-if="skills" title="天赋" class="suit-list">
			<div v-for="(s, sKey) of skills" :key="sKey" class="suit-item">
				<div class="circle-image-icon">
					<img class="center" :src="s.icon" alt="ERROR">
				</div>
				<p class="suit-info">
					<span class="title">{{ s.name }}</span>
					<span class="suit-type">Lv.{{ s.levelCurrent }}</span>
				</p>
			</div>
		</InfoCard>
		<InfoCard v-if="data.constellations.detail" :title="'命之座('+ data.activedConstellationNum +'/6)'" class="constellations-list">
			<div v-for="(c, cKey) of data.constellations.detail" :key="cKey" class="circle-image-icon" :class="{ locked: cKey >= data.activedConstellationNum }">
				<img class="center" :src="c.icon" alt="ERROR">
				<i class="icon-lock center"></i>
			</div>
		</InfoCard>
		<InfoCard v-if="data.weapon" class="weapon-card">
			<div class="weapon-info-box">
				<CharacterEquipment :src="data.weapon.icon" emptyIcon="icon-weapon"></CharacterEquipment>
				<div class="weapon-info-content">
					<p class="weapon-info">
						<h3>{{ data.weapon.name }}</h3>
						<span class="weapon-level">Lv{{ data.weapon.level }}</span>
						<span class="weapon-affixLevel">精炼{{ data.weapon.affixLevel }}阶</span>
					</p>
					<div class="star-box">
						<img v-for="(s, sKey) of data.weapon.rarity" :key="sKey" src="https://adachi-bot.oss-cn-beijing.aliyuncs.com/images/stars/Icon_1_Stars.png" alt="ERROR">
					</div>
				</div>
			</div>
			<p class="weapon-desc">{{ weaponDesc }}</p>
		</InfoCard>
	</main>
	<footer>
		<p class="sign">Modify - Adachi-GBOT</p>
	</footer>
</div>
`

import { parseURL, request } from "../../public/js/src.js";
import CharacterEquipment from "./equipment.js";
import InfoCard from "./infoCard.js";
import ScoreChart from "./score-chart.js";

const { defineComponent, computed, ref } = Vue;

export default defineComponent( {
	name: "CharacterApp",
	template,
	components: {
		CharacterEquipment,
		InfoCard,
		ScoreChart
	},
	setup() {
		const urlParams = parseURL( location.search );
		const data = request( `/api/char?qq=${ urlParams.qq }` );
		
		/* 是否显示评分 */
		const showScore = computed( () => {
			return urlParams.showScore === "true";
		} )
		
		/* echart图表颜色 */
		const chartColor = ref( null );
		
		function setStyle( colorList ) {
			document.documentElement.style.setProperty( "--baseInfoColor", colorList[0] );
			chartColor.value = {
				graphic: colorList[0],
				text: colorList[1]
			};
			document.documentElement.style.setProperty( "--hue-rotate", colorList[2] )
		}
		
		const elementIconSrc = `https://adachi-bot.oss-cn-beijing.aliyuncs.com/images/element/Element_${ data.element }.png`;
		const portrait = computed( () => {
			return `https://adachi-bot.oss-cn-beijing.aliyuncs.com/Version2/portrait/${ data.id }.png`;
		} );
		
		/* 武器描述处理 */
		const weaponDesc = computed( () => {
			return data?.weapon?.desc?.replace( /[\\r\\n]/g, "" );
		} )
		
		// 圣遗物默认图标
		const artifactsFontIcon = [ "icon-flower", "icon-plume", "icon-sands", "icon-goblet", "icon-circle" ]
		
		/* 整理圣遗物数组 */
		const artifacts = computed( () => {
			if ( data.artifacts.length >= 5 ) return data.artifacts
			const list = new Array( 5 )
			list.fill( {} )
			for ( const a of data.artifacts ) {
				list.splice( a.pos - 1, 1, a )
			}
			return list
		} )
		
		const effectList = computed( () => {
			return data.effects.map( effect => {
				const [ key, num ] = effect.name.split( ' ' )
				return { name: key, num, icon: effect.icon }
			} )
		} )
		
		switch ( data.element ) {
			case "Anemo":
				setStyle( [ "#1ddea7", "#006746", "120deg" ] );
				break;
			case "Cryo":
				setStyle( [ "#1daade", "#004b66", "165deg" ] );
				break;
			case "Dendro":
				setStyle( [ "#5dde1d", "#226600", "85deg" ] );
				break;
			case "Electro":
				setStyle( [ "#871dde", "#380066", "240deg" ] );
				break;
			case "Geo":
				setStyle( [ "#de8d1d", "#663c00", "0deg" ] );
				break;
			case "Hydro":
				setStyle( [ "#1d8dde", "#003c66", "180deg" ] );
				break;
			case "Pyro":
				setStyle( [ "#de3a1d", "#660f00", "315deg" ] );
				break;
			case "None":
				setStyle( [ "#757575", "#666666", "0deg" ] );
				break;
		}
		
		return {
			data,
			skills: data.skills,
			portrait,
			showScore,
			effectList,
			chartColor,
			elementIconSrc,
			artifactsFontIcon,
			artifacts,
			weaponDesc
		}
	}
} );
