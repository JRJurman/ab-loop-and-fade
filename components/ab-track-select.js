/*
 * This file contains the ab-track-select component.
 * It is a component for a select with an action control that is meant to hold a list of tracks.
 */

const ABTrackSelectStyleSheet = new CSSStyleSheet();
ABTrackSelectStyleSheet.replaceSync(`
	:host {
		display: grid;
		grid-template-columns: 1fr 125px;
		gap: 1em;
	}

	label {
		display: grid;
		grid-template-columns: 83px 1fr;
		gap: 1em;
	}

	select {
		width: 100%;
	}
`);

class ABTrackSelect extends HTMLElement {
	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [ABTrackSelectStyleSheet];
	}

	get selectedTrack() {
		return this.trackSelect.selectedOptions[0];
	}

	get selectedTrackBlock() {
		return this.selectedTrack.blockReference;
	}

	connectedCallback() {
		const labelElement = document.createElement('label');
		labelElement.textContent = this.getAttribute('label');

		this.trackSelect = document.createElement('select');
		labelElement.append(this.trackSelect);

		const noTrackOption = document.createElement('option');
		noTrackOption.textContent = 'No Track';
		this.trackSelect.append(noTrackOption);

		this.actionButton = document.createElement('button');
		this.actionButton.textContent = this.getAttribute('action');

		this.shadowRoot.append(labelElement, this.actionButton);

		this.actionButton.addEventListener('click', () => {
			this.dispatchEvent(new Event('trigger-action', { bubbles: true, composed: true }));
		});
	}

	addTrackOption(abAudioBlock, selectOption) {
		const newTrackOption = document.createElement('option');
		newTrackOption.textContent = 'No Track';
		newTrackOption.value = 'No Track';
		newTrackOption.blockReference = abAudioBlock;

		if (selectOption) {
			newTrackOption.selected = true;
		}

		abAudioBlock.addEventListener('load-track', () => {
			newTrackOption.textContent = abAudioBlock.fileName;
			newTrackOption.value = abAudioBlock.fileName;
		});

		this.trackSelect.append(newTrackOption);
	}

	setSelectedTrack(trackValue) {
		this.trackSelect.value = trackValue;
	}
}

customElements.define('ab-track-select', ABTrackSelect);
