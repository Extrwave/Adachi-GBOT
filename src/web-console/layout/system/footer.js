const template = `<div class="footer-view">
	<div class="footer-content">
		<span v-if="!isMobile">MIT Licensed | </span>
		<span>Adachi-GBOT - 管理面板</span>
	</div>
</div>`;

const { defineComponent, computed, inject } = Vue;

export default defineComponent( {
	name: "FooterView",
	template,
	setup() {
		const { device } = inject( "app" );
		const isMobile = computed( () => device.value === "mobile" );
		
		return {
			isMobile
		};
	}
} );