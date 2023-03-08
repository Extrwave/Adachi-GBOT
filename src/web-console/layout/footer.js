const template =
	`<div class="layout-footer">
	<span v-if="!isMobile">MIT Licensed | </span>
	<span>Adachi-GBOT - 管理面板</span>
</div>`;

const { defineComponent } = Vue;

export default defineComponent( {
	name: "Footer",
	props: { isMobile: Boolean },
	template
} );