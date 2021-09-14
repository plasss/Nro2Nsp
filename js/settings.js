const settings = require('electron-settings');
const {ipcRenderer} = require('electron')
const fs = require('fs');

let keysLocation = null; // keys.dat file
let saveLocation = null; // Where the nsps will be saved to
let homebrewLocation = null; // The directory containing homebrew files
let coreLocation = null; // Retroarch core location

const btnKeysLocation = document.getElementById('btnKeysLocation'); // Select keys file button
const btnSaveLocation = document.getElementById('btnSaveLocation'); // Select save location

btnKeysLocation.addEventListener('click', (event) => {
	ipcRenderer.send('selectKeysLocation');
});

btnSaveLocation.addEventListener('click', (event) => {
	ipcRenderer.send('btnSaveLocation');
});

ipcRenderer.on('selectedKeysFile', (event, path) => {
	document.getElementById('inputKeys').value = `${path}`;
});

ipcRenderer.on('selectedSaveLocation', (event, path) => {
	document.getElementById('inputSaveLocation').value = `${path}`;
});

$('#formSettings').submit(async function (event) {
	event.preventDefault();
	keysLocation = document.getElementById('inputKeys').value;
	saveLocation = document.getElementById('inputSaveLocation').value;
	homebrewLocation = document.getElementById('inputHomebrews').value;
	coreLocation = document.getElementById('inputCoreLocation').value;

	if (homebrewLocation.substr(-1) !== '/') {
		homebrewLocation += '/'
	}

	if (coreLocation !== '' && coreLocation.substr(-1) !== '/') {
		coreLocation += '/'
	}

	try {
		if (!fs.existsSync(keysLocation)) {
			ipcRenderer.send('informationDialog', 'The keys file does not exist');
		} else if (!fs.existsSync(saveLocation)) {
			ipcRenderer.send('informationDialog', 'The save directory does not exist');
		} else {
			await settings.set('files', {
				keys: keysLocation,
				saveLocation: saveLocation,
				homebrewLocation: homebrewLocation,
				coreLocation: coreLocation
			});
			ipcRenderer.send('informationDialog', `Settings have been saved`);

			$('#modalSettings').modal('hide');
		}

	} catch (reason) {
		ipcRenderer.send('informationDialog', `An error occurred while trying to save settings.\r\n\r\nReason: ${reason}`); // error
		return false;
	}
});

$(document).ready(async function() {
	await loadSettings();
});

async function loadSettings() {
	try {
		const settingsSaved = await settings.has('files.keys');

		let filesExist = false;

		if (settingsSaved) {
			keysLocation = await settings.get('files.keys');
			saveLocation = await settings.get('files.saveLocation');
			homebrewLocation = await settings.get('files.homebrewLocation');
			coreLocation = await settings.get('files.coreLocation');
			if (fs.existsSync(keysLocation) && fs.existsSync(saveLocation)) {
				filesExist = true;
			}
		}

		if (filesExist) {
			document.getElementById('inputKeys').value = keysLocation;
			document.getElementById('inputSaveLocation').value = saveLocation;
			document.getElementById('inputHomebrews').value = homebrewLocation;
			document.getElementById('inputCoreLocation').value = coreLocation;
		} else {
			$('#modalSettings').modal('show');
		}
	} catch (reason) {
		ipcRenderer.send('informationDialog', `An error occurred while trying to load settings.\r\n\r\nReason: ${reason}`); // error
		return false;
	}

}