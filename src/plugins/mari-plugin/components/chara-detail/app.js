const template = `<div class="chara-detail" :class="{ none: data.element === 'none' }">
	<div class="portrait-box">
		<img class="portrait" :src="portrait" alt="portrait">
	</div>
	<div class="detail-top">
		<div class="user">
			<img :src="userAvatar" alt="avatar">
			<div class="user-info">
				<p>UID {{ data.uid }}</p>
				<p>{{ data.username }}</p>
			</div>
		</div>
		<div class="avatar-info">
			<p>
				<span class="avatar-name">{{ data.name }}</span>
				<p class="level-info">Lv{{ data.level }}</p>
				<p class="talent-info">{{ data.talent }}命</p>
			</p>
			<p class="fetter-info">好感度等级：{{ data.fetter }}</p>
		</div>
		<div class="base-info card">
			<div v-for="(a, aKey) of overview" :key="aKey" class="list-item">
				<p class="base-info-label">
					<svg class="iconpark-icon" :style="{ color: a.color }">
						<use :href="a.icon"></use>
					</svg>
					<span class="label">{{ a.attr }}</span>
				</p>
				<p class="base-info-value">
					<span>{{ a.resultValue }}</span>
					<span v-if="a.extraValue" class="extra">(+{{ a.extraValue }})</span>
				</p>
			</div>
		</div>
		<div class="talent">
			<p class="model-title">命座</p>
			<ul class="talent-content">
				<li v-for="t in 6" :class="{ block: t > data.talent }" :key="t">
					<img :src="getTalentIcon(t)" :alt="'talent' + t">
				</li>
			</ul>
		</div>
		<div class="skill">
			<p class="model-title">天赋</p>
			<ul class="skill-content">
				<li v-for="(s, sKey) of skills" :key="sKey">
					<img :src="getSkillIcon(s.name)" :alt="s.name">
					<div class="skill-level" :class="{ special: s.ext }">
						<span>{{ s.level }}</span>
					</div>
				</li>
			</ul>
		</div>
	</div>
	<div class="detail-bottom">
		<div class="artifact-list">
		<div class="extra-info">
				<div class="weapon-card card">
					<i class="icon-weapon bg-icon"></i>
					<div class="weapon-icon">
						<img :src="weaponIcon" :alt="data.weapon.name">
						<p>{{ data.weapon.name }}</p>
					</div>
					<div class="weapon-info">
						<p class="level-rank">
							<span>Lv {{ data.weapon.level }}</span>
							<span>R{{ data.weapon.affix }}</span>
						</p>
						<p class="star-list">
							<img v-for="s in data.weapon.star" :key="s" src="https://mari-plugin.oss-cn-beijing.aliyuncs.com/image/common/star.png" alt="STAR">
						</p>
						<p class="weapon-attr">
							<p v-for="(a, aKey) of data.weapon.attrs">
								<svg class="iconpark-icon" :style="{ color: a.color }">
									<use :href="a.icon"></use>
								</svg>
								<span>{{ a.value }}</span>
							</p>
						</p>
					</div>
				</div>
				<div class="artifact-effect card">
					<i class="icon-flower bg-icon"></i>
					<template v-if="data.artifact.effects?.length">
						<p v-for="(e, eKey) of data.artifact.effects">
							<span>{{ e.count }}件套：</span>
							<span>{{ e.name }}</span>
						</p>
					</template>
					<p v-else class="artifact-effect-empty">暂无圣遗物套装数据</p>
				</div>
			</div>
			<artifact v-for="(a, aKey) of artifacts" :position="aKey" :key="aKey" :data="a" />
		</div>
	</div>
	<div class="author">@BOT Adachi-GBOT</div>
</div>`;

import { request, parseURL } from "../../public/js/src.js";
import Artifact from "./artifact.js";

const { defineComponent, computed, onMounted } = Vue;

export default defineComponent( {
	name: "CharaDetailApp",
	template,
	components: {
		Artifact
	},
	setup() {
		const urlParams = parseURL( location.search );
		const { data } = request( `/api/chara?uid=${ urlParams.uid }` );
		
		const styleMap = {
			anemo: [ "#41c88f", "110deg", "120deg" ],
			cryo: [ "#41aac8", "150deg", "165deg" ],
			dendro: [ "#51c841", "60deg", "70deg" ],
			electro: [ "#6e41c8", "210deg", "225deg" ],
			geo: [ "#c88b41", "-5deg", "0deg" ],
			hydro: [ "#4176c8", "170deg", "176deg" ],
			pyro: [ "#c84141", "310deg", "315deg" ],
			none: [ "#999999", "0deg", "0deg" ]
		}
		
		// 圣遗物默认图标
		const artifactsFontIcon = [ "icon-flower", "icon-plume", "icon-sands", "icon-goblet", "icon-circle" ]
		
		onMounted( () => {
			const elemStyle = styleMap[data.element];
			document.documentElement.style.setProperty( "--base-color", elemStyle[0] );
			document.documentElement.style.setProperty( "--bg-hue-rotate", elemStyle[1] );
			document.documentElement.style.setProperty( "--talent-hue-rotate", elemStyle[2] );
		} )
		
		/* 格式化技能 */
		const skills = [];
		for ( const skillKey in data.skill ) {
			if ( skillKey === "undefined" ) continue;
			skills.push( {
				...data.skill[skillKey],
				name: skillKey
			} )
		}
		
		/* 给圣遗物添加种类图标 */
		const artifacts = computed( () => data.artifact.list.map( ( a, aKey ) => {
			return {
				...a,
				typeIcon: artifactsFontIcon[aKey]
			}
		} ) )
		
		/* 获取头像 */
		const userAvatar = data.avatar === ""
			? `https://mari-plugin.oss-cn-beijing.aliyuncs.com/image/character/${ data.id }/face.png`
			: data.avatar;
		
		const weaponIcon = computed( () => {
			return `https://mari-plugin.oss-cn-beijing.aliyuncs.com/image/weapon/thumb/${ data.weapon.name }.png`;
		} );
		
		const portrait = computed( () => {
			return `https://mari-plugin.oss-cn-beijing.aliyuncs.com/image/character/${ data.id }/gacha_splash.png`;
		} );
		
		const overview = computed( () => {
			const name = "元素伤害加成";
			const bonusAttr = {};
			data.overview
				.filter( el => el.attr.includes( name ) )
				.forEach( el => {
					if ( !Reflect.get( bonusAttr, el.baseValue ) ) {
						Reflect.set( bonusAttr, el.baseValue, [ el.attr ] )
					} else {
						Reflect.get( bonusAttr, el.baseValue ).push( el.attr )
					}
				} );
			/* 查找 baseValue 相同数量大于2的伤害加成属性 */
			const filterBonus = Object.values( bonusAttr ).find( el => el.length > 2 ) || [];
			const list = data.overview.sort( ( prev, next ) => {
				if ( prev.attr.includes( name ) && next.attr.includes( name ) ) {
					const getValue = el => Number.parseInt( el.baseValue.replace( "%", "" ) )
					return getValue( next ) - getValue( prev );
				}
			} ).filter( el => {
				/* 剔除重复的伤害加成属性 */
				return !filterBonus.includes( el.attr );
			} )
			/* 最多展示9个 */
			list.splice( 9 );
			return list;
		} )
		
		function getTalentIcon( talentKey ) {
			return `https://mari-plugin.oss-cn-beijing.aliyuncs.com/image/character/${ data.id }/cons_${ talentKey }.png`
		}
		
		function getSkillIcon( skillKey ) {
			return `https://mari-plugin.oss-cn-beijing.aliyuncs.com/image/character/${ data.id }/talent_${ skillKey }.png`
		}
		
		return {
			data,
			artifacts,
			urlParams,
			userAvatar,
			overview,
			portrait,
			skills,
			weaponIcon,
			getTalentIcon,
			getSkillIcon
		}
	}
} );


