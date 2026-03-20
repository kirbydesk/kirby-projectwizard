import Overview from './views/Overview.vue';
import FieldRow from './views/components/FieldRow.vue';
import ColorFieldRow from './views/components/ColorFieldRow.vue';
import GlobalElements from './views/components/GlobalElements.vue';
import BlockSettings from './views/components/BlockSettings.vue';
import GlobalFonts from './views/components/GlobalFonts.vue';
import GlobalElementStyles from './views/components/GlobalElementStyles.vue';
import GlobalNavigation from './views/components/GlobalNavigation.vue';
import GlobalFontManager from './views/components/GlobalFontManager.vue';

panel.plugin('kirbydesk/kirby-projectwizard', {
	components: {
		'pw-wizard-overview': Overview,
		'pw-field-row': FieldRow,
		'pw-color-field-row': ColorFieldRow,
		'pw-global-elements': GlobalElements,
		'pw-global-fonts': GlobalFonts,
		'pw-block-settings': BlockSettings,
		'pw-global-elements-styles': GlobalElementStyles,
		'pw-global-navigation': GlobalNavigation,
		'pw-global-font-manager': GlobalFontManager,
	},
});
