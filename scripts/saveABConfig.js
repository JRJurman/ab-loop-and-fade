/*
 * This file contains the main script and functions for saving and loading `.abconfig` files.
 * These files are special files that contain a header, JSON config, and the original audio file.
 * The header contains a magic string ('ABCONFIG'), a version number ('01'), and the length of the JSON config.
 * The JSON config contains the details from `ab-controls`, as well as some other file and app meta data.
 */

const version = 1;
const magic = 'ABCONFIG';

const versionSize = 2;
const jsonLengthSize = 4;

const magicBytes = Uint8Array.from(magic.split(''), (char) => char.charCodeAt(0));
const magicSize = magicBytes.length;

const headerSize = magicSize + versionSize + jsonLengthSize;
const headerOffset = 0;
const versionOffset = magicSize;
const jsonLengthOffset = magicSize + versionSize;

const littleEndian = true;

const buildAudioPackageBlob = async (audioFile, config) => {
	// metadata config
	const meta = {
		type: 'AB-CONFIG',
		version: version,
		mime: audioFile.type,
		name: audioFile.name,
		config: config,
	};

	// convert meta config to UTF-8 bytes
	const jsonBytes = new TextEncoder().encode(JSON.stringify(meta));

	// build header for our file
	const header = new Uint8Array(headerSize);

	header.set(magicBytes, headerOffset);
	const dv = new DataView(header.buffer);
	dv.setUint16(versionOffset, version, littleEndian);
	dv.setUint32(jsonLengthOffset, jsonBytes.length, littleEndian);

	return new Blob([header, jsonBytes, audioFile], { type: 'application/octet-stream' });
};

const downloadABConfig = async (audioFile, config) => {
	const blob = await buildAudioPackageBlob(audioFile, config);
	const url = URL.createObjectURL(blob);

	// generate a suggested filename
	const fileName = audioFile.name.replace(/\..*/, '');
	const suggestedName = `${fileName}.abconfig`;

	const a = document.createElement('a');
	a.href = url;
	a.download = suggestedName;
	a.click();
	URL.revokeObjectURL(url);
};

const loadConfigFile = async (configFile) => {
	const headerBuffer = await configFile.slice(0, headerSize).arrayBuffer();
	const header = new Uint8Array(headerBuffer);

	// check magic string
	const fileMagic = String.fromCharCode(...header.slice(0, magicSize));
	if (fileMagic !== magic) {
		console.warn('Magic string does not match, expected ', magic, ' got ', fileMagic);
	}

	// check version
	const dv = new DataView(headerBuffer);
	const fileVersion = dv.getUint16(versionOffset, littleEndian);

	if (fileVersion !== version) {
		console.warn('Version does not match, expected', version, ' got ', fileVersion);
	}

	// pull json length, and read the json config (this includes pointA, pointB, crossfade, etc)
	const jsonLength = dv.getUint32(jsonLengthOffset, littleEndian);
	const jsonStart = headerSize;
	const jsonEnd = jsonStart + jsonLength;

	const jsonBuffer = await configFile.slice(jsonStart, jsonEnd).arrayBuffer();
	const meta = JSON.parse(new TextDecoder().decode(jsonBuffer));

	// load the audio file (everything after the JSON)
	const audioBlob = configFile.slice(jsonEnd);

	const audioFile = new File([audioBlob], meta.name, {
		type: meta.mime,
		lastModified: Date.now(),
	});

	return {
		config: meta.config,
		audioFile,
	};
};
