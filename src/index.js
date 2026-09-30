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
import Lock from './views/components/Lock.vue';
import SetupWizard from './views/SetupWizard.vue';
import Portal from './views/components/Portal.vue';
import BlockPreview from './views/components/BlockPreview.vue';
import DeviceSelect from './views/components/DeviceSelect.vue';
import JsonNode from './views/components/JsonNode.vue';

panel.plugin('kirbydesk/kirby-projectwizard', {
	icons: {
		// text transform: glyphs instead of names (as in design tools)
		'prw-case-none': '<rect x="6" y="11" width="12" height="2.2" rx="1.1"/>',
		'prw-case-upper': '<text x="12" y="17.5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" font-weight="600">AA</text>',
		'prw-case-lower': '<text x="12" y="17" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" font-weight="600">aa</text>',
		'prw-case-capitalize': '<text x="12" y="17.5" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15.5" font-weight="600">Aa</text>',
		'prw-step-large': '<path d="M18.2072 9.0428 12.0001 2.83569 5.793 9.0428 7.20721 10.457 12.0001 5.66412 16.793 10.457 18.2072 9.0428ZM5.79285 14.9572 12 21.1643 18.2071 14.9572 16.7928 13.543 12 18.3359 7.20706 13.543 5.79285 14.9572Z"></path>',
		'prw-step-small': '<path d="M5.79285 5.20718 12 11.4143 18.2071 5.20718 16.7928 3.79297 12 8.58586 7.20706 3.79297 5.79285 5.20718ZM18.2072 18.7928 12.0001 12.5857 5.793 18.7928 7.20721 20.207 12.0001 15.4141 16.793 20.207 18.2072 18.7928Z"></path>',
		// the lists' markers (Elements › Lists › Bullets): dot, dash, check
		'prw-marker-disc': '<circle cx="12" cy="12" r="3.5"></circle>',
		'prw-marker-circle': '<path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM12 17.5C8.96243 17.5 6.5 15.0376 6.5 12C6.5 8.96243 8.96243 6.5 12 6.5C15.0376 6.5 17.5 8.96243 17.5 12C17.5 15.0376 15.0376 17.5 12 17.5Z"></path>',
		'prw-marker-box': '<path d="M8.5 8.5H15.5V15.5H8.5V8.5Z"></path>',
		'prw-marker-arrow': '<path d="M16.17 11L10.81 5.64L12.22 4.22L20 12L12.22 19.78L10.81 18.36L16.17 13H4V11H16.17Z"></path>',
		'prw-marker-chevron': '<path d="M13.17 12L8.22 7.05L9.64 5.64L16 12L9.64 18.36L8.22 16.95L13.17 12Z"></path>',
		'prw-marker-star': '<path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z"></path>',
		'prw-marker-dash': '<path d="M6 11H18V13H6V11Z"></path>',
		'prw-marker-check': '<path d="M10 15.17L19.19 5.98L20.61 7.39L10 18L3.64 11.64L5.05 10.22L10 15.17Z"></path>',
		// the lists (Elements › Lists): points with lines
		'prw-list': '<path d="M8 4H21V6H8V4ZM3 3.5H6V6.5H3V3.5ZM3 10.5H6V13.5H3V10.5ZM3 17.5H6V20.5H3V17.5ZM8 11H21V13H8V11ZM8 18H21V20H8V18Z"></path>',
		// the entries (Elements › Entries): shapes with lines
		'prw-entries': '<path d="M13 4H21V6H13V4ZM13 11H21V13H13V11ZM13 18H21V20H13V18ZM6.5 19C5.39543 19 4.5 18.1046 4.5 17C4.5 15.8954 5.39543 15 6.5 15C7.60457 15 8.5 15.8954 8.5 17C8.5 18.1046 7.60457 19 6.5 19ZM6.5 21C8.70914 21 10.5 19.2091 10.5 17C10.5 14.7909 8.70914 13 6.5 13C4.29086 13 2.5 14.7909 2.5 17C2.5 19.2091 4.29086 21 6.5 21ZM5 6V9H8V6H5ZM3 4H10V11H3V4Z"></path>',
		'prw-guides': '<path d="M8 8V16H16V8H8ZM6 6H18V18H6V6ZM6 2H8V5H6V2ZM6 19H8V22H6V19ZM2 6H5V8H2V6ZM2 16H5V18H2V16ZM19 6H22V8H19V6ZM19 16H22V18H19V16ZM16 2H18V5H16V2ZM16 19H18V22H16V19Z"></path>',
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
		'pw-block-preview': BlockPreview,
		'pw-device-select': DeviceSelect,
		'pw-json-node': JsonNode,
		'pw-lock': Lock,
	},
});
