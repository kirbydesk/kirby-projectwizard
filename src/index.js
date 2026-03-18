import Overview from './views/Overview.vue';
import FieldRow from './views/components/FieldRow.vue';

panel.plugin('kirbydesk/kirby-projectwizard', {
	components: {
		'pw-wizard-overview': Overview,
		'pw-field-row': FieldRow,
	},
});
