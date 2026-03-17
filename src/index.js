import Overview from './views/Overview.vue';
import BlockEditor from './views/BlockEditor.vue';

panel.plugin('kirbydesk/kirby-projectwizard', {
	components: {
		'pw-wizard-overview': Overview,
		'pw-wizard-block-editor': BlockEditor,
	},
});
