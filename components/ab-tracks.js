/*
 * This file contains the ab-tracks component.
 * It is a generic component for displaying a label, range input, and a corresponding output element.
 * There is also logic for setting / reading query parameters (unused).
 */

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
		this.shadowRoot.adoptedStyleSheets = [abAudioTracksStyleSheet];

		this.masterVolume = 1;
		this.crossfade = 1500;
		this.pointA = 30;
		this.pointB = 90;
		this.passthrough = false;
		this.intervalMS = 10;
		this.crossfadeIntervalIds = {};
	}

	get isPlaying() {
		return !this.audio1.paused || !this.audio2.paused;
	}

	connectedCallback() {
		// populate the shadow root with all the elements this component needs
		this.audio1 = document.createElement('audio');
		this.audio1.controls = true;

		this.audio2 = document.createElement('audio');
		this.audio2.controls = true;

		this.audio1Volume = document.createElement('ab-range-input');
		this.audio1Volume.setCommonConfig(0, 1, 'any', 'float');
		this.audio1Volume.value = 1;
		this.audio1Volume.disabled = true;
		this.audio1Volume.textContent = 'Volume';

		this.audio2Volume = document.createElement('ab-range-input');
		this.audio2Volume.setCommonConfig(0, 1, 'any', 'float');
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

	stepCrossfade(crossFadeInvervalKey, crossFadeFrom, crossFadeTo, fadeRate) {
		// helper function to slowly control the volume of each audio player

		// change the volume based on our intervalMS and crossfade value
		// (if we have a fadeRate, use that instead)
		const volumeIncrement = fadeRate || this.intervalMS / this.crossfade;
		if (crossFadeFrom) {
			crossFadeFrom.volume = Math.max(crossFadeFrom.volume - volumeIncrement, 0);
		}
		if (crossFadeTo) {
			crossFadeTo.volume = Math.min(crossFadeTo.volume + volumeIncrement, this.masterVolume);
		}

		// if we've finished, clear the interval
		const crossFadeToHasMasterVolume = crossFadeTo?.volume >= this.masterVolume;
		const crossFadeFromHasNoVolume = crossFadeFrom?.volume <= 0;
		if (crossFadeToHasMasterVolume || crossFadeFromHasNoVolume) {
			clearInterval(this.crossfadeIntervalIds[crossFadeInvervalKey]);
			delete this.crossfadeIntervalIds[crossFadeInvervalKey];
			this.crossfadeIntervalIds;
			if (crossFadeFrom) {
				crossFadeFrom.pause();
			}
		}
	}

	startCrossfade(fromAudioElement, toAudioElement, overrides) {
		// setup our toAudioElement (if we have one)
		if (toAudioElement) {
			toAudioElement.volume = 0;
			toAudioElement.currentTime = overrides?.start ?? this.pointA;
			toAudioElement.play();
		}

		// fixed interval of 10 ms
		const crossFadeInvervalKey = parseInt(Object.keys(this.crossfadeIntervalIds).at(-1) || '-1') + 1;
		this.crossfadeIntervalIds[crossFadeInvervalKey] = setInterval(
			() => this.stepCrossfade(crossFadeInvervalKey, fromAudioElement, toAudioElement, overrides?.fadeRate),
			this.intervalMS
		);
	}

	watchForCrossFade() {
		// helper function to check if we should be triggering a crossfade
		const onTimeUpdate = (audioElement, otherAudioElement) => {
			// if we're already crossfading, do nothing
			if (Object.values(this.crossfadeIntervalIds).length > 0) {
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
				this.startCrossfade(audioElement, otherAudioElement);
			}
		};

		this.audio1.addEventListener('timeupdate', () => onTimeUpdate(this.audio1, this.audio2));
		this.audio2.addEventListener('timeupdate', () => onTimeUpdate(this.audio2, this.audio1));
	}

	addPlaybackListener(callback) {
		this.audio1.addEventListener('timeupdate', callback);
		this.audio2.addEventListener('timeupdate', callback);
	}

	play() {
		this.audio1.currentTime = 0;
		this.audio1.volume = this.masterVolume;
		this.audio1.play();
	}

	fadeOut() {
		this.audio1.volume = this.masterVolume;
		this.audio2.volume = this.masterVolume;

		this.startCrossfade(this.audio1, null, { fadeRate: 0.001 });
		this.startCrossfade(this.audio2, null, { fadeRate: 0.001 });
	}

	fadeIn() {
		this.audio1.volume = this.masterVolume;
		this.audio2.volume = this.masterVolume;

		this.startCrossfade(null, this.audio1, { start: 0, fadeRate: 0.001 });
	}
}

customElements.define('ab-tracks', ABAudioTracks);
