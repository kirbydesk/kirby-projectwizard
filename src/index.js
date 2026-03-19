import Overview from './views/Overview.vue';
import FieldRow from './views/components/FieldRow.vue';
import ColorFieldRow from './views/components/ColorFieldRow.vue';
import GlobalElements from './views/components/GlobalElements.vue';
import GlobalColors from './views/components/GlobalColors.vue';
import BlockSettings from './views/components/BlockSettings.vue';

panel.plugin('kirbydesk/kirby-projectwizard', {
	components: {
		'pw-wizard-overview': Overview,
		'pw-field-row': FieldRow,
		'pw-color-field-row': ColorFieldRow,
		'pw-global-elements': GlobalElements,
		'pw-global-colors': GlobalColors,
		'pw-block-settings': BlockSettings,
	},
});
