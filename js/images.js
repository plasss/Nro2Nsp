const {ipcRenderer} = require('electron');
window.$ = window.jQuery = require('jquery');

const btnSelectImage = document.getElementById('btnSelectImage'); // Select image from computer
const btnImageGallery = document.getElementById('btnImageGallery'); // Search for images
const imageSelect = document.getElementById('imageGallery'); // Search for images
const btnConfirmImage = document.getElementById('btnConfirmImage'); // Select image from gallery

let currentImageURL = null; // Image URL from api
let previousImage = null; // Previous selected image from gallery

btnSelectImage.addEventListener('click', (event) => {
	ipcRenderer.send('selectImageLocation');
});

btnImageGallery.addEventListener('click', (event) => {
	let gameName = document.getElementById('inputTitleName').value;
	if (gameName !== "") {
		ipcRenderer.send('searchImages', gameName);
	} else {
		ipcRenderer.send('informationDialog', 'You need to type in the applications name before searching the gallery.');
	}
});

ipcRenderer.on('selectedImage', (event, path) => {
	document.getElementById('imagePreview').src = null; // Reset the image source otherwise new images will not show
	document.getElementById('imagePreview').src = path;
	$('#modalImages').modal('hide');

});

btnConfirmImage.addEventListener('click', (event) => {
	if (currentImageURL) ipcRenderer.send('downloadImage', `https://cdn.thegamesdb.net/images/original/${currentImageURL}`); // If an image has been selected, download it to temp
});

ipcRenderer.on('receiveImages', (event, data) => {
	let imageURL = '';
	previousImage = null;

	$('#modalImages').modal('show');
	data = JSON.parse(data);
	document.getElementById('imageGallery').innerHTML = '';

	for (const boxart in data['include']['boxart']['data']) {
		for (const games in data['include']['boxart']['data'][boxart]) {
			imageURL = data['include']['boxart']['data'][boxart][games]['filename'];
			document.getElementById('imageGallery').innerHTML += `
			<div class="col-md-4">
    	  		<div class="thumbnail">
          			<img class="imageSelect mb-3" id="${imageURL}" src="https://cdn.thegamesdb.net/images/thumb/${imageURL}" style="width:100%">
      			</div>
    		</div>`;
		}
	}
	document.getElementById('imageLoader').classList.add('visually-hidden');

});

imageSelect.addEventListener('click', (event) => {
	currentImageURL = event.target.closest("img").id;
	if (previousImage) document.getElementById(previousImage).className = "imageSelect mb-3";
	document.getElementById(currentImageURL).className = "imageSelect border border-3 border-primary mb-3";
	previousImage = currentImageURL;
});
