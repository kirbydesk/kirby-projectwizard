import Overview from './views/Overview.vue';
import FieldRow from './views/components/FieldRow.vue';
import ColorFieldRow from './views/components/ColorFieldRow.vue';
import GlobalElements from './views/components/GlobalElements.vue';
import BlockSettings from './views/components/BlockSettings.vue';
import GlobalFonts from './views/components/GlobalFonts.vue';
import GlobalElementStyles from './views/components/GlobalElementStyles.vue';
import GlobalNavigation from './views/components/GlobalNavigation.vue';
import GlobalFontManager from './views/components/GlobalFontManager.vue';
import BlockValues from './views/components/BlockValues.vue';
import SetupWizard from './views/SetupWizard.vue';
import Portal from './views/components/Portal.vue';

panel.plugin('kirbydesk/kirby-projectwizard', {
	icons: {
		'prw-header': '<path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM20 5H4V19H20V5ZM18 7V9H6V7H18Z"></path>',
		'prw-footer': '<path d="M21 3C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3H21ZM4 16V19H20V16H4ZM4 14H20V5H4V14Z"></path>',
	},
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
		'pw-block-values': BlockValues,
		'pw-wizard-setup': SetupWizard,
		'pw-portal': Portal,
	},
});
