/**
 * v-pw-autosize – number inputs flat in a table row (.pw-field-table):
 * the input is only as wide as its value, so the unit can follow right
 * behind the number ("1.5 rem"). A click anywhere in the rest of the
 * field puts the cursor into the input. Outside the table nothing changes.
 *
 * Arrow up/down change the value by its step (the input's `step`, else
 * 0.1), with Shift by ten steps; each step is applied right away (change).
 * Typed values are kept within the input's min / max as well.
 *
 * Whole numbers are shown with ".0" (2 → 2.0) – only in the field: the
 * value handed on (change) stays as it is.
 */
const size = (el) => {
	if (!el.closest('.pw-field-table')) {
		el.style.width = '';
		return;
	}
	// the inputs use the mono font: one character = 1ch
	el.style.width = Math.max(String(el.value).length, 1) + 0.5 + 'ch';
};

// 2 → 2.0 (not while typing)
const format = (el) => {
	if (/^-?\d+$/.test(String(el.value).trim())) el.value = String(el.value).trim() + '.0';
	size(el);
};

const decimals = (number) => (String(number).split('.')[1] || '').length;

// a number within the input's min / max
const clamp = (el, number) => {
	const min = parseFloat(el.getAttribute('min'));
	const max = parseFloat(el.getAttribute('max'));
	if (!Number.isNaN(min)) number = Math.max(min, number);
	if (!Number.isNaN(max)) number = Math.min(max, number);
	return number;
};

const stepBy = (el, direction, big) => {
	const current = parseFloat(String(el.value).replace(',', '.'));
	if (Number.isNaN(current)) return;
	const step = (parseFloat(el.getAttribute('step')) || 0.1) * (big ? 10 : 1);
	const places = Math.max(decimals(step), decimals(current));
	el.value = String(clamp(el, Number((current + direction * step).toFixed(places))));
	el.dispatchEvent(new Event('change'));
	format(el);
};

export default {
	inserted(el) {
		format(el);
		// while typing the value is left alone; arrows and leaving the field
		// format it again
		el.addEventListener('input', () => {
			el.pwTyping = true;
			size(el);
		});
		el.addEventListener('blur', () => {
			el.pwTyping = false;
			format(el);
		});
		// a typed value is kept within min / max as the arrows do; capturing,
		// so it is corrected before the field's own change handler reads it
		el.addEventListener('change', () => {
			const typed = parseFloat(String(el.value).replace(',', '.'));
			if (Number.isNaN(typed)) return;
			const kept = clamp(el, typed);
			if (kept !== typed) el.value = String(kept);
		}, true);
		el.addEventListener('keydown', (event) => {
			if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
			event.preventDefault();
			el.pwTyping = false;
			stepBy(el, event.key === 'ArrowUp' ? 1 : -1, event.shiftKey);
		});
		const wrap = el.parentNode;
		if (wrap) {
			wrap.addEventListener('mousedown', (event) => {
				// the input itself, or a control of its own (e.g. the unit choice)
				if (event.target === el || event.target.closest('select, button')) return;
				event.preventDefault();
				el.focus();
			});
		}
	},
	componentUpdated(el) {
		// Vue writes the stored value back in (e.g. "3" after an arrow step)
		if (el.pwTyping) size(el);
		else format(el);
	},
};
