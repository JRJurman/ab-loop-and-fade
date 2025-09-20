const abAudioBlockStyleSheet = new CSSStyleSheet();
abAudioBlockStyleSheet.replaceSync(`
	:host {
		display: flex;
		flex-direction: column;
		width: 100%;
		gap: 0.5em;
	}

	fieldset {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		border-radius: 20px;
		border-color: currentColor;
		border-style: solid;
	}
`);

// helper function for getting audio duration
const getAudioDuration = (fileURL) => {
	return new Promise((resolve, reject) => {
		const audio = new Audio();
		audio.src = fileURL;
		audio.preload = 'metadata';

		audio.onloadedmetadata = () => {
			resolve(audio.duration);
		};
	});
};

class ABAudioBlock extends HTMLElement {
	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [abAudioBlockStyleSheet];
	}

	connectedCallback() {
		// populate the shadow root with all the elements this component needs
		this.fileInput = document.createElement('input');
		this.fileInput.type = 'file';
		this.fileInput.accept = 'audio/*';

		const trackFieldset = document.createElement('fieldset');
		const trackFieldsetLegend = document.createElement('legend');
		trackFieldsetLegend.textContent = 'Tracks';
		this.audioTracks = document.createElement('ab-tracks');
		trackFieldset.append(trackFieldsetLegend, this.audioTracks);

		const controlFieldset = document.createElement('fieldset');
		const controlFieldsetLegend = document.createElement('legend');
		controlFieldsetLegend.textContent = 'Controls';
		this.controls = document.createElement('ab-controls');
		controlFieldset.append(controlFieldsetLegend, this.controls);

		const detailsElement = document.createElement('details');
		detailsElement.open = true;
		this.detailsElementSummary = document.createElement('summary');
		this.detailsElementSummary.style.display = 'none';
		detailsElement.append(this.detailsElementSummary, this.fileInput, trackFieldset, controlFieldset);
		this.shadowRoot.append(detailsElement);

		// wire file loading control
		this.fileInput.addEventListener('change', async () => {
			const url = URL.createObjectURL(this.fileInput.files?.[0]);

			// load the audio to the audio players
			this.audioTracks.loadSource(url);

			// update the point A and B max values
			const duration = await getAudioDuration(url);
			this.controls.pointA.max = duration;
			this.controls.pointB.max = duration;

			// update the summary element
			this.detailsElementSummary.style.display = '';
			this.detailsElementSummary.textContent = this.fileInput.files?.[0].name;

			// hide the file input control
			this.fileInput.style.display = 'none';
		});

		// wire crossfade and point elements to audio tracks
		this.controls.crossfade.addEventListener(
			'input',
			() => (this.audioTracks.crossfade = parseInt(this.controls.crossfade.value))
		);
		this.controls.pointA.addEventListener(
			'input',
			() => (this.audioTracks.pointA = parseInt(this.controls.pointA.value))
		);
		this.controls.pointB.addEventListener(
			'input',
			() => (this.audioTracks.pointB = parseInt(this.controls.pointB.value))
		);
		this.controls.passthrough.addEventListener(
			'change',
			() => (this.audioTracks.passthrough = this.controls.passthrough.checked)
		);
	}
}

customElements.define('ab-audio-block', ABAudioBlock);
