/*
 * This file contains the ab-controls component.
 * This component has the controls for an ab-audio-block (pointA, pointB, etc).
 * This component also controls what configuration is saved / loaded in an `.abconfig` file.
 */

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
		this.passthrough.name = 'passthrough';
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
			this.pointB.disabled = this.passthrough.checked;
		};
		this.passthrough.addEventListener('change', onPassthroughChange);
	}

	getConfig() {
		return {
			pointA: this.pointA.value,
			pointB: this.pointB.value,
			crossfade: this.crossfade.value,
		};
	}

	loadConfig(newConfig) {
		// this sets the max value before setting the actual value, so we don't clip to the existing max
		// (these will get fixed up later when we load the true duration)
		// additionally, we dispatch an input event, so that elements that are watching for this input update

		this.pointA.max = newConfig.pointA;
		this.pointA.value = newConfig.pointA;
		this.pointA.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

		this.pointB.max = newConfig.pointB;
		this.pointB.value = newConfig.pointB;
		this.pointB.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

		this.crossfade.value = newConfig.crossfade;
		this.crossfade.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
	}
}

customElements.define('ab-controls', ABControls);
