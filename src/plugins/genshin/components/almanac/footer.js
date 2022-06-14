const template =
	`<div class="almanac-footer">
	<img class="dire-title" src="../../public/images/almanac/direction.svg" alt="ERROR"/>
	<div class="dire-content">
		<p>面朝{{ d }}玩原神<br/>稀有掉落概率UP</p>
	</div>
	<p class="design">Designed - genshin.pub</p>
	<p class="author">Modify - 七七</p>
</div>`;

const { defineComponent } = Vue;

export default defineComponent( {
	name: "AlmanacFooter",
	template,
	props: {
		d: String
	}
} );