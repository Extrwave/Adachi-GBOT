const template = `<div class="abyss-base">
	<span class="uid">{{ uid }}</span>
	<slot />
	<p class="footer">Modify - 七七</p>
</div>`;

const { defineComponent, computed } = Vue;

export default defineComponent( {
	name: "Base",
	template,
	props: {
		data: Object
	},
	setup( props ) {
		const info = props.data.info;
		const uid = computed( () => info.split( "-" ).join( " " ) );
		
		return {
			uid
		}
	}
} );