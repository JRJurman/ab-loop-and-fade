/*
 * This file contains the ab-audio-block component; it is a combination of ab-controls, ab-tracks, and a file input.
 * It is the main block in the app for each track.
 * It is dependent on the `saveABConfig.js` scripts (for saving and loading `.abconfig` files)
 */

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

	summary {
		float: left;
		width: 100%;
    overflow: hidden;
    white-space: nowrap;
	}

	details[open] summary {
		width: 78%;
	}

	summary.playing::marker {
		content: '🔊 ';
	}

	input {
		color: rgba(0,0,0,0)
	}

	button {
		font-family: 'Kanit', sans-serif;
		text-decoration: underline;
		cursor: pointer;
		background: none;
		color: currentColor;
		border: none;
		font-size: 1em;
		font-weight: inherit;
		padding: 0;
	}

	#exportButton {
		display: block;
    margin-left: auto;
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
		this.fileInputLabel = document.createElement('label');
		this.fileInputLabel.textContent = 'Audio Tracks / ABConfigs ';
		this.fileInput = document.createElement('input');
		this.fileInput.multiple = true;
		this.fileInput.type = 'file';
		this.fileInput.accept = '.abconfig,audio/*';
		this.fileInputLabel.append(this.fileInput);

		this.exportConfig = document.createElement('button');
		this.exportConfig.id = 'exportButton';
		this.exportConfig.textContent = 'Export Config';
		this.exportConfig.style.display = 'none';

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
		detailsElement.append(
			this.detailsElementSummary,
			this.fileInputLabel,
			this.exportConfig,
			trackFieldset,
			controlFieldset
		);

		this.shadowRoot.append(detailsElement);

		// wire file loading control
		this.fileInput.addEventListener('change', async () => {
			const fileToLoad = this.fileInput.files?.[0];

			this.loadFile(fileToLoad);

			// if there were more files, create new tracks and load them
			if (this.fileInput.files.length > 1) {
				[...this.fileInput.files].slice(1).forEach((file) => {
					addTrack(file);
				});
			}
		});

		// wire export control
		this.exportConfig.addEventListener('click', () => {
			downloadABConfig(this.file, this.controls.getConfig());
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

		// if audio is playing, update summary element
		this.audioTracks.addPlaybackListener(() => {
			if (this.audioTracks.isPlaying) {
				this.detailsElementSummary.classList.add('playing');
			}
			if (!this.audioTracks.isPlaying) {
				this.detailsElementSummary.classList.remove('playing');
			}
		});
	}

	async loadFile(file) {
		if (file.name.endsWith('.abconfig')) {
			const { audioFile, config } = await loadConfigFile(file);
			this.file = audioFile;
			this.controls.loadConfig(config);
		} else {
			this.file = file;
		}
		const url = URL.createObjectURL(this.file);

		// load the audio to the audio players
		this.audioTracks.loadSource(url);

		// update the point A and B max values
		const duration = await getAudioDuration(url);
		this.controls.pointA.max = duration;
		this.controls.pointB.max = duration;

		// update the summary element
		const fileName = file.name.replace(/\..+$/, '');
		this.detailsElementSummary.style.display = '';
		this.detailsElementSummary.textContent = fileName;
		this.detailsElementSummary.title = fileName;

		// reveal the export control
		this.exportConfig.style.display = '';

		// hide the file input control
		this.fileInputLabel.style.display = 'none';
	}
}

customElements.define('ab-audio-block', ABAudioBlock);
