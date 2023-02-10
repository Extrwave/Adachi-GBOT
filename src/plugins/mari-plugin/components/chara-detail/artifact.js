const template = `<div class="artifact card">
	<template v-if="!isEmpty">
		<div class="artifact-base">
			<img :src="artifactIcon" :alt="data.artifactName">
			<div class="artifact-base-info">
				<p class="artifact-name">{{ data.artifactName }}</p>
				<p class="artifact-info">
					<span class="level">+{{ data.level }}</span>
					<p class="star-list">
						<img v-for="s of data.rank" :key="s" src="https://mari-plugin.oss-cn-beijing.aliyuncs.com/image/common/star.png" alt="STAR">
					</p>
				</p>
			</div>
		</div>
		<div class="list-item special">
			<p class="attr-label">{{ data.mainAttr.attr }}</p>
			<p class="attr-label-value">{{ data.mainAttr.value }}</p>
		</div>
		<div v-for="(sub, subKey) of data.subAttr" :key="subKey" class="list-item">
			<p class="attr-label">{{ sub.attr }}</p>
			<p class="attr-label-value">{{ sub.value }}</p>
		</div>
	</template>
	<div v-else class="is-empty">
		<i :class="data.typeIcon"></i>
	</div>
</div>`

const { defineComponent, computed } = Vue;

export default defineComponent( {
	name: "CharaDetailArtifact",
	template,
	props: {
		data: {
			type: Object
		},
		position: {
			type: String
		},
		avatar: {
			type: String
		}
	},
	setup( props ) {
		const data = props.data;
		const position = props.position;
		
		const isEmpty = computed( () => !data || Object.keys( data ).length <= 1 );
		
		const artifactIcon = computed( () => {
			if ( !data ) return "";
			return `https://mari-plugin.oss-cn-beijing.aliyuncs.com/image/artifact/${ data.shirtId }/${ position }.png`;
		} )
		
		return {
			isEmpty,
			artifactIcon
		}
	}
} )