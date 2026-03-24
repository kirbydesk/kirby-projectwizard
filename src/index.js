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
	icons: {
		'prw-blocks': '<path d="M3 4C3 3.44772 3.44772 3 4 3H10C10.5523 3 11 3.44772 11 4V10C11 10.5523 10.5523 11 10 11H4C3.44772 11 3 10.5523 3 10V4ZM3 14C3 13.4477 3.44772 13 4 13H10C10.5523 13 11 13.4477 11 14V20C11 20.5523 10.5523 21 10 21H4C3.44772 21 3 20.5523 3 20V14ZM13 4C13 3.44772 13.4477 3 14 3H20C20.5523 3 21 3.44772 21 4V10C21 10.5523 20.5523 11 20 11H14C13.4477 11 13 10.5523 13 10V4ZM13 14C13 13.4477 13.4477 13 14 13H20C20.5523 13 21 13.4477 21 14V20C21 20.5523 20.5523 21 20 21H14C13.4477 21 13 20.5523 13 20V14ZM15 5V9H19V5H15ZM15 15V19H19V15H15ZM5 5V9H9V5H5ZM5 15V19H9V15H5Z"></path>',
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
	},
});
