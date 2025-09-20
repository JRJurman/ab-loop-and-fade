const abAudioTracksStyleSheet = new CSSStyleSheet();
abAudioTracksStyleSheet.replaceSync(`
	audio {
		width: 100%;
	}
`);

class ABAudioTracks extends HTMLElement {
	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.adoptedStyleSheets = [abRangeInputStyleSheet];

		this.masterVolume = 1;
		this.crossfade = 1500;
		this.crossFadeFrom = undefined;
		this.crossFadeTo = undefined;
		this.pointA = 30;
		this.pointB = 90;
		this.passthrough = false;
	}

	connectedCallback() {
		// populate the shadow root with all the elements this component needs
		this.audio1 = document.createElement('audio');
		this.audio1.controls = true;

		this.audio2 = document.createElement('audio');
		this.audio2.controls = true;

		this.audio1Volume = document.createElement('ab-range-input');
		this.audio1Volume.setAttribute('min', 0);
		this.audio1Volume.setAttribute('max', 1);
		this.audio1Volume.setAttribute('step', 'any');
		this.audio1Volume.setAttribute('format', 'float');
		this.audio1Volume.value = 1;
		this.audio1Volume.disabled = true;
		this.audio1Volume.textContent = 'Volume';

		this.audio2Volume = document.createElement('ab-range-input');
		this.audio2Volume.setAttribute('min', 0);
		this.audio2Volume.setAttribute('max', 1);
		this.audio2Volume.setAttribute('step', 'any');
		this.audio2Volume.setAttribute('format', 'float');
		this.audio2Volume.value = 1;
		this.audio2Volume.disabled = true;
		this.audio2Volume.textContent = 'Volume';

		this.shadowRoot.append(this.audio1, this.audio1Volume, this.audio2, this.audio2Volume);

		// wire track volume controls
		const onVolumeChange = (audioElement, trackInput) => {
			trackInput.value = audioElement.volume;
		};
		this.audio1.addEventListener('volumechange', () => onVolumeChange(this.audio1, this.audio1Volume));
		this.audio2.addEventListener('volumechange', () => onVolumeChange(this.audio2, this.audio2Volume));

		// wire crossfade functionality
		this.watchForCrossFade();
	}

	loadSource(fileURL) {
		this.audio1.src = fileURL;
		this.audio2.src = fileURL;
	}

	setMasterVolume(newVolume) {
		this.masterVolume = newVolume;
		this.audio1.volume = newVolume;
		this.audio2.volume = newVolume;
	}

	watchForCrossFade() {
		const intervalMS = 10;
		const startCrossfade = (fromAudioElement, toAudioElement) => {
			this.crossFadeFrom = fromAudioElement;
			this.crossFadeTo = toAudioElement;

			// setup our toAudioElement
			toAudioElement.volume = 0;
			toAudioElement.currentTime = this.pointA;
			toAudioElement.play();

			// fixed interval of 10 ms
			this.crossfadeIntervalId = setInterval(stepCrossfade, intervalMS);
		};

		const stepCrossfade = () => {
			// change the volume based on our intervalMS and crossfade value
			const volumeIncrement = intervalMS / this.crossfade;
			this.crossFadeFrom.volume = Math.max(this.crossFadeFrom.volume - volumeIncrement, 0);
			this.crossFadeTo.volume = Math.min(this.crossFadeTo.volume + volumeIncrement, this.masterVolume);

			// if we've finished, clear the interval
			if (this.crossFadeTo.volume >= this.masterVolume) {
				clearInterval(this.crossfadeIntervalId);
				this.crossFadeFrom.pause();
				this.crossFadeFrom = undefined;
				this.crossFadeTo = undefined;
			}
		};

		const onTimeUpdate = (audioElement, otherAudioElement) => {
			// if we're already crossfading, do nothing
			if (this.crossFadeFrom || this.crossFadeTo) {
				return;
			}
			// if the element is paused, do nothing
			if (audioElement.paused) {
				return;
			}
			// if passthrough is enabled, do nothing
			if (this.passthrough) {
				return;
			}
			// if we've hit the end (point B), start the other audio element
			if (audioElement.currentTime >= this.pointB) {
				startCrossfade(audioElement, otherAudioElement);
			}
		};

		this.audio1.addEventListener('timeupdate', () => onTimeUpdate(this.audio1, this.audio2));
		this.audio2.addEventListener('timeupdate', () => onTimeUpdate(this.audio2, this.audio1));
	}
}

customElements.define('ab-tracks', ABAudioTracks);
