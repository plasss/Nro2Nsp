const {ipcRenderer} = require('electron');
window.$ = window.jQuery = require('jquery');
window.Bootstrap = require('bootstrap');

const btnResetForm = document.getElementById('btnResetForm'); // Retroarch nro forwarder
const rdoNROType = document.getElementById('rdoNROType'); // Standard nro forwarder
const rdoNROType2 = document.getElementById('rdoNROType2'); // Retroarch nro forwarder

let isRetroarch = false;

let noImage = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAASSSURBVHhe7drbcdtIEEDRzVxRMApGwSSYBIPwUjL3oVpA9tqYwVTdc/6skvzVd6ZJ4I83CBMAaQIgTQCkCYA0AZAmANIEQJoASBMAaQIgTQCkCYA0AZAmANIEQJoASBMAaQIgTQCkCYA0AZAmANIEQJoASBMAaQIgTQCkCYA0AZAmANIEQJoASBMAaQIgTQCkCYA0AZAmANIEQJoASBMAaQIgTQCkCYA0AZAmANIEQJoASBMAaQIgTQCkCYA0AZAmANIEQJoASBMAaQIgTQCkCYA0AZAmANIEQJoASBMAaQIgTQCkCYA0AZAmANIEQJoASBMAaQIgTQCkCYA0AZAmANIEMNjlcr3d7vfH07fP3n/0uN9vt+vl8vplphPAGM+xfw79a9R/yuP+LOH110wjgIN9TP5rpn+BDCYTwGF+c/T/5VmBCCYRwBGOm/2/Pe7X13/OSAI4wOV28PR/p4EJBHCALwJ4vC/118vT63e/e/77/cuhH3bzsAsNJoADbAXwPL5/6tvNH21PEhhLAAf4HMAvfJFzuX4RgUVoJAEc4J8A3s/91w//r/09SgEDCeAAr9n97W3lev8Y+P9QwDgCOMB7AIfs6nu3gAKGEcABLtfDnt5uXwI+CQ8jgLXs3AGugFEEsJjtK0AAowhgMdtXgABGEcBi3ABzCWAxmwH4EDyMANZiA5pMAEvZnn8XwDgCWImnANMJYB07zwDM/0gCWMb28W//H0sAi9gZf8f/YAJYwc7yY/zHE8D5dg5/4z+DAE62d/jb/ecQwJl2p9/hP4sATmP6VyCAc+xPv9VnKgGcYHf6Lf7TCWA2Z/9SBDDVZfcrT9N/DgFMtDf9Np/zCGCW3dXH9J9JAHN42rsoAczgTbdlCWC8neXH+K9AAMNtH/82/zUIYLTN+Xf6r0IAg23Ov+N/GQIYa3P/N//rEMBYWxeA/WchAhhq8wIQwEIEMJQAVieAsaxAixPAWL4EWpwAxtp+CqyAZQhgMM/B1iaAwbavAAWsQgCjbRdgC1qEAEgTAGkCIE0ApAmANAGQJgDSBECaAEgTAGkCmOJyvd0ff70S8Xjcr14FWoQAxvM+3MIEMNrm+9AfJLAAAYy18y7oi1dCTyeAsfbP/3fugNMJYKyvA3AFnE4AY1mBFieA0XwIXpoAxvM16MIEMMWnB2HfHvebJ2GLEABpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiBNAKQJgDQBkCYA0gRAmgBIEwBpAiDs7e1PmP+QA7hZD90AAAAASUVORK5CYII=`;

document.addEventListener('DOMContentLoaded', (event) => {
	generateID();
	document.getElementById('imagePreview').src = noImage;
});

btnResetForm.addEventListener('click', (event) => {
	document.getElementById('generateNRO').reset();
	generateID();
	document.getElementById('imagePreview').src = noImage;
	ipcRenderer.send('resetImage');
})

rdoNROType.addEventListener('click', (event) => {
	toggleType();
});

rdoNROType2.addEventListener('click', (event) => {
	toggleType();
});

function toggleType() {
	isRetroarch = !isRetroarch;
	document.getElementById('inputNROName').disabled = !document.getElementById('inputNROName').disabled;
	document.getElementById('inputNROName').required = !document.getElementById('inputNROName').required;
	document.getElementById('inputCoreName').disabled = !document.getElementById('inputCoreName').disabled;
	document.getElementById('inputRomLocation').disabled = !document.getElementById('inputRomLocation').disabled;
	document.getElementById('inputCoreName').required = !document.getElementById('inputCoreName').required;
	document.getElementById('inputRomLocation').required = !document.getElementById('inputRomLocation').required;

}

$('#generateNRO').submit(function (event) {
	event.preventDefault();

	try {
		let options = {
			keysLocation: document.getElementById('inputKeys').value,
			titleName: document.getElementById('inputTitleName').value,
			titlePublisher: document.getElementById('inputAuthor').value,
			titleID: document.getElementById('inputTitleID').value,
			nroLocation: document.getElementById('inputNROLocation').value + document.getElementById('inputNROName').value,
			coreLocation: document.getElementById('inputCoreLocation').value,
			romLocation: document.getElementById('inputRomLocation').value,
			saveLocation: document.getElementById('inputSaveLocation').value,
			isRetroarch: isRetroarch
		}
		ipcRenderer.send('createNSP', options);
	} catch (reason) {
		ipcRenderer.send('informationDialog', `An error occurred while trying to create the NSP.\r\n\r\nReason: ${reason}`); // error
		return false;
	}
});


/*
	Generates a random title ID for the NRO forwarder
 */

$('#generateID').on('click', function () {
	generateID();
});

function generateID() {
	let id = "05";
	let tempNum = null;

	for (let length = 0; length !== 14; length++) {
		tempNum = Math.floor(Math.random() * 16); // Generate a random number between 1 and 16

		if (tempNum === 10) {
			id += "A";
		} else if (tempNum === 11) {
			id += "B";
		} else if (tempNum === 12) {
			id += "C";
		} else if (tempNum === 13) {
			id += "D";
		} else if (tempNum === 14) {
			id += "E";
		} else if (tempNum === 15) {
			id += "F";
		} else {
			id += tempNum;
		}
	}
	$('#inputTitleID').val(id);
}