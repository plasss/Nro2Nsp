const { app, BrowserWindow, ipcMain, dialog} = require('electron')
const https = require('https');
const querystring = require('querystring');
const settings = require('electron-settings');
const {download} = require("electron-dl");
const fs = require('fs');
const resizeImg = require('resize-img');
let win = null
const { exec } = require('child_process');

let imageLocation = "resources//images//image.png";

async function createWindow() {
	let width = 800;
	let height = 1050;
	let x = null;
	let y = null;

	const settingsSaved = await settings.has('windowState.width'); // Restore the windows size and position
	if (settingsSaved) {
		width = await settings.get('windowState.width');
		height = await settings.get('windowState.height');
		x = await settings.get('windowState.x');
		y = await settings.get('windowState.y');
	}

	win = new BrowserWindow({
		width: width,
		height: height,
		minWidth: 600,
		minHeight: 700,
		x: x,
		y: y,
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			enableRemoteModule: true
		}
	});

	/*
		Remembers the applications window position and size
	 */
	win.on('close',  async (event) => {
		event.preventDefault();
		let size = win.getSize();
		let pos = win.getPosition();
		await settings.set('windowState', {
			width: size[0],
			height: size[1],
			x: pos[0],
			y: pos[1]
		});
		app.exit();
	});

	await win.loadFile('index.html')

}

app.whenReady().then(() => {
	createWindow()
})

ipcMain.on('selectKeysLocation', (event) => {
	dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{ name: 'keys file', extensions: ['txt', 'keys', 'ini', 'dat'] }
		]
	}).then(result => {
		if (!result.canceled) event.sender.send('selectedKeysFile', result.filePaths)
	}).catch(err => {
		console.log(err)
	})
})

ipcMain.on('btnSaveLocation', (event) => {
	dialog.showOpenDialog({
		properties: ['openDirectory']
	}).then(result => {
		if (!result.canceled) event.sender.send('selectedSaveLocation', result.filePaths)
	}).catch(err => {
		console.log(err)
	})
})

ipcMain.on('loadSettings', (event) => {
	let settingsSaved;
	settings.has('files.keys').then(function(data){settingsSaved = data;});
	let keysLocation = null;
	let hacBrewPackLocation = null;

	if (settingsSaved) {
		keysLocation = settings.get('files.keys');
		hacBrewPackLocation = settings.get('files.hacBrewPack');
	}
	event.sender.send('receiveSettings', settingsSaved, keysLocation, hacBrewPackLocation)
});


/*
	Opens the systems file selector dialog
 */

ipcMain.on('selectImageLocation', (event) => {
	dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{ name: 'images', extensions: ['png', 'jpg', 'jpeg'] }
		]
	}).then(result => {
		if (!result.canceled) resizeImage(result.filePaths[0])
	}).catch(err => {
		console.log(err)
	})
});

/*
	Searches for images on the games db api
 */

ipcMain.on('searchImages', (event, name) => {
	let receivedData = '';
	let key = 'b166a9bf5bd3e7e70e50ab4c89a784996729f4bcaad010bf181abcf8dc43847e';

	const data = {
		apikey: key,
		name: name,
		include: "boxart"
	};
	const get_request_args = querystring.stringify(data);

	const options = {
		method: 'GET',
		hostname: 'api.thegamesdb.net',
		port: 443,
		path: '/v1/Games/ByGameName?' + get_request_args,
		headers : {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	};

	const req = https.request(options, res => {
		//console.log(`statusCode: ${res.statusCode}`)

		res.on('data', chunk => {
			receivedData += chunk;
		})

		res.on('end', error => {
			event.sender.send('receiveImages', receivedData);
		})

	})

	req.on('error', error => {
		informationDialog(`An error occurred while trying to fetch images.\r\n\r\nReason: ${error}`); // error
		return;
	})

	req.end();

});

/*
	Downloads an image from the specified URL and then transfers it to the resize function
 */

ipcMain.on('downloadImage', (event, url) => {
	try {
		const options = {
			directory: app.getPath("temp")
		};

		download(BrowserWindow.getFocusedWindow(), url, options)
			.then(
				dl => resizeImage(dl.getSavePath())
			);
	} catch (error) {
		informationDialog(`An error occurred while trying to download the full image.\r\n\r\nReason: ${error}`); // error
		return;
	}
});

/*
	Resizes an image to 256x256 then returns the location
 */

async function resizeImage(currentLocation) {
	try {
		let fileName = currentLocation.substring(currentLocation.lastIndexOf('\\')+1, currentLocation.length);
		imageLocation = app.getPath("temp") + "\\new" + fileName;
		const icon = await resizeImg(fs.readFileSync(currentLocation), {
			width: 256,
			height: 256
		});

		fs.writeFileSync(imageLocation, icon);
		win.webContents.send("selectedImage", imageLocation);
	} catch (error) {
		informationDialog(`An error occurred while trying to process the image.\r\n\r\nReason: ${error}`); // error
		return;
	}
}


ipcMain.on('resetImage', (event, url) => {
	imageLocation = "resources//images//image.png";
});

/*
	System information dialog
 */

ipcMain.on('informationDialog', (event, message) => {
	informationDialog(message);
});

function informationDialog(message) {
	const options = {
		type: 'info',
		title: 'Information',
		message: message,
		buttons: ['OK']
	};
	dialog.showMessageBox(options);
}

/*
	Creates all the necessary files to generate the NSP and then communicates with hacbrewpack
 */

ipcMain.on('createNSP', async (event, options) => {
	try {
		let nextArgv = options.nroLocation; // nro data for romfs files
		let nextNroPath = options.nroLocation;

		await fs.copyFile(imageLocation, 'resources\\hacbrewpack\\control\\icon_AmericanEnglish.dat', function (error) {
			if (error) {
				informationDialog(`An error occurred while trying to generate the NSP.\r\n\r\nReason: ${error}`); // error
				return;
			}
		});

		if (options.isRetroarch) {
			nextArgv = `${options.coreLocation} "${options.romLocation}"`;
			nextNroPath = options.coreLocation;
		}

		await fs.writeFile('resources\\hacbrewpack\\romfs\\nextArgv', nextArgv, function (error) {
			if (error) {
				informationDialog(`An error occurred while trying to generate the NSP.\r\n\r\nReason: ${error}`); // error
				return;
			}
		});

		await fs.writeFile('resources\\hacbrewpack\\romfs\\nextNroPath', nextNroPath, function (error) {
			if (error) {
				informationDialog(`An error occurred while trying to generate the NSP.\r\n\r\nReason: ${error}`); // error
				return;
			}
		});

		await exec(`resources\\hacbrewpack\\hacbrewpack.exe --titleid ${options.titleID} --titlename "${options.titleName}" --titlepublisher "${options.titlePublisher}" --keyset "${options.keysLocation}" --controldir resources\\hacbrewpack\\control --logodir resources\\hacbrewpack\\logo --romfs resources\\hacbrewpack\\romfs --exefsdir resources\\hacbrewpack\\exefs --nspdir "${options.saveLocation}"`, (error, stdout, stderr) => {
			if (error) {
				informationDialog(`An error occurred while trying to create the NSP. Is your keyfile correct?`); // error
				return;
			}
			informationDialog(`Your NSP has been created successfully`);
		});

	} catch (error) {
		informationDialog(`An error occurred while trying to create the NSP.\r\n\r\nReason: ${error}`); // error

	}

});
