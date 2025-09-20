const abControlsStyleSheet = new CSSStyleSheet();
abControlsStyleSheet.replaceSync(`
	label {
		display: flex;
		align-items: center;
		gap: 0.2em;
	}
`);

class ABControls extends HTMLElement {
	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [abControlsStyleSheet];
	}

	connectedCallback() {
		// populate the shadow root with all the elements this component needs
		this.pointA = document.createElement('ab-range-input');
		this.pointA.setCommonConfig(0, 100, 1, 'time');
		this.pointA.value = 30;
		this.pointA.textContent = 'Point A';

		this.pointB = document.createElement('ab-range-input');
		this.pointB.setCommonConfig(0, 100, 1, 'time');
		this.pointB.value = 90;
		this.pointB.textContent = 'Point B';

		const passthroughLabel = document.createElement('label');
		this.passthrough = document.createElement('input');
		this.passthrough.type = 'checkbox';
		passthroughLabel.textContent = 'Passthrough';
		passthroughLabel.append(this.passthrough);

		this.crossfade = document.createElement('ab-range-input');
		this.crossfade.setCommonConfig(0, 5000, 100, 'ms');
		this.crossfade.value = 1500;
		this.crossfade.textContent = 'Crossfade';

		this.shadowRoot.append(this.pointA, this.pointB, passthroughLabel, this.crossfade);

		// wire passthrough handler
		const onPassthroughChange = () => {
			this.pointB.disabled = passthrough.checked;
		};
		this.passthrough.addEventListener('change', onPassthroughChange);
	}
}

customElements.define('ab-controls', ABControls);
