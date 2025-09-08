const abRangeInputStyleSheet = new CSSStyleSheet();
abRangeInputStyleSheet.replaceSync(`
	label {
		display: flex;
		align-items: center;
		gap: 1em;
	}
	input {
		flex: 1;
	}
	output {
		min-width: 2em;
		text-align: right;
	}
	:host([format="ms"]) output {
		min-width: 4em;
	}
`);

class ABRangeInput extends HTMLElement {
	static observedAttributes = ['value', 'disabled'];

	constructor() {
		super();

		this.attachShadow({ mode: 'open' });

		this.shadowRoot.adoptedStyleSheets = [abRangeInputStyleSheet];
	}

	get value() {
		return this.getAttribute('value');
	}
	set value(newValue) {
		if (this.isConnected) {
			this.inputElement.value = newValue;
		}
		this.setAttribute('value', newValue);
	}

	get disabled() {
		return this.getAttribute('disabled');
	}
	set disabled(newValue) {
		this.setAttribute('disabled', newValue);
		if (this.isConnected) {
			this.inputElement.disabled = newValue;
		}
	}

	get max() {
		return this.getAttribute('max');
	}
	set max(newValue) {
		if (this.isConnected) {
			this.inputElement.max = newValue;
		}
		this.setAttribute('max', newValue);
	}

	connectedCallback() {
		// populate the shadow root with all the elements this component needs
		this.labelElement = document.createElement('label');
		this.inputElement = document.createElement('input');
		this.outputElement = document.createElement('output');
		this.slotElement = document.createElement('slot');

		this.inputElement.setAttribute('type', 'range');
		this.inputElement.setAttribute('min', this.getAttribute('min'));
		this.inputElement.setAttribute('step', this.getAttribute('step'));

		// if this value could be in the search params, check there as well
		const searchValue = new URLSearchParams(window.location.search).get(this.id);
		const value = searchValue || this.getAttribute('value');
		this.value = value;

		// set the max (if this is below the value, update the max to that)
		const maxValue = Math.max(this.getAttribute('max'), this.value);

		this.inputElement.setAttribute('max', maxValue);
		this.inputElement.value = this.value;

		if (this.hasAttribute('disabled')) {
			this.inputElement.setAttribute('disabled', '');
		}

		this.labelElement.append(this.slotElement, this.inputElement, this.outputElement);
		this.shadowRoot.append(this.labelElement);

		// wire up event listener for input
		this.inputElement.addEventListener('input', () => {
			this.setAttribute('value', this.inputElement.value);
			this.value = this.inputElement.value;
			this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
		});

		this.updateOutputValue();
	}

	attributeChangedCallback(attributeName, oldValue, newValue) {
		// if we haven't created the shadowRoot, don't worry about updating anything
		if (!this.isConnected) {
			return;
		}

		// if the value hasn't changed, don't do anything
		// (this prevents query parameters from being set when we don't actually have updates)
		if (oldValue == newValue) {
			return;
		}

		if (attributeName === 'value') {
			// update the output element based on new a new value
			this.updateOutputValue();
			// update the query parameter if this is storable with search params
			if (this.hasAttribute('param')) {
				this.updateSearchParams();
			}
		}

		if (attributeName === 'disabled') {
			if (this.hasAttribute('disabled')) {
				this.inputElement.setAttribute('disabled', '');
			} else {
				this.inputElement.removeAttribute('disabled');
			}
		}
	}

	updateOutputValue() {
		const format = this.getAttribute('format');
		if (format === 'time') {
			const rawSeconds = this.inputElement.value % 60;
			const seconds = rawSeconds < 10 ? `0${rawSeconds}` : rawSeconds;
			const minutes = Math.floor(this.inputElement.value / 60);
			this.outputElement.value = `${minutes}:${seconds}`;
		} else if (format === 'float') {
			this.outputElement.value = parseFloat(this.inputElement.value).toFixed(2);
		} else if (format === 'ms') {
			this.outputElement.value = `${this.inputElement.value} ms`;
		} else {
			this.outputElement.value = this.inputElement.value;
		}
	}

	updateSearchParams() {
		const url = new URL(window.location.href);
		url.searchParams.set(this.id, this.value);
		window.history.replaceState(null, '', url.toString());
	}
}

customElements.define('ab-range-input', ABRangeInput);
