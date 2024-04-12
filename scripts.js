document.addEventListener("DOMContentLoaded", function () {
	// Create constants for where items are in save file binary.
	const cardNameAdr = [0x10004, 0x1001f];
	const caliBlockTop = [0xd000, 0xd057];
	const caliBlockBot = [0xe000, 0xe057];
	const caliHeaderLoAdr = [0xd000, 0xd011];
	const caliDataLoAdr = [0xd012, 0xd04f];
	const fileTop = [0x0, 0xcfff];
	const fileBottom = [0xe060, 0x20000];

	// Create constants for parts of the calibration data block.
	const caliHead = new Uint8Array([0x43, 0x61, 0x72, 0x64, 0x2d, 0x45, 0x20, 0x52, 0x65, 0x61, 0x64, 0x65, 0x72, 0x20, 0x32, 0x30, 0x30, 0x31]);
	const caliBadFlag = new Uint8Array([0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

	// Get parts of the HTML and other functiony stuff because I'm lazy.
	const calibrationFile = document.getElementById("caliF");
	const inputFile = document.getElementById("inputF");
	const outputFile = document.getElementById("outputF");
	const submitButton = document.getElementById("submitButton");
	const patchButton = document.getElementById("patchButton");
	const downloadButton = document.getElementById("downloadButton");
	var enc = new TextDecoder("utf-8");

	// Create my arrays so I can get them later.
	var patchedArray = new Uint8Array(null);
	var caliArray = new Uint8Array(null);
	var inputArray = new Uint8Array(null);

	// Create some objects for making sure the user can't break the sequence of how this should work.
	var filesSelected = { caliF: false, inputF: false };
	var downloadValid = { filesPatched: false, nameSet: false };

	// Store data we want to keep hold of.
	var caliFileProperties = filePropertyBuilder();
	var inputFileProperties = filePropertyBuilder();
	var outputFileProperties = filePropertyBuilder();

	// Less lines of code === I'm a better programmer... right?
	function filePropertyBuilder() {
		return {
			fileName: undefined,
			caliValid: undefined,
			caliData: undefined,
			cardValid: undefined,
			cardName: undefined,
		};
	}

	function namer() {
		const fileNameInput = outputFile;
		fileName = fileNameInput.value.trim(); // Update the fileName variable
		return fileName; // Return the trimmed value of the text input
	}

	function nameStripper(name) {
		const end = name.indexOf(0);
		if (end !== -1) {
			name = name.slice(0, end);
		}
		return name;
	}

	function submitTest() {
		// Check if text input is empty
		if (outputFile.value.trim() == "" || outputFile.value == outputFileProperties["fileName"]) {
			// Enable the submit button
			submitButton.disabled = true;
		} else {
			// Disable the submit button
			submitButton.disabled = false;
		}
	}

	function enableButton(trackerVars, buttonName) {
		if (Object.values(trackerVars).every(Boolean)) {
			buttonName.disabled = false; // Enable the patch button
		} else {
			buttonName.disabled = true; // Disable the patch button
		}
	}

	function arrayToFormattedHex(uint8Array) {
		return Array.from(uint8Array, (byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
	}

	function saveArrayBuilder(file) {
		return new Promise((resolve, reject) => {
			var reader = new FileReader();

			reader.onload = function (event) {
				var fileCont = event.target.result;
				resolve({
					fileName: file.files[0].name,
					data: new Uint8Array(fileCont),
				}); // Resolve the promise with an object containing both the file name and the data
			};
			reader.readAsArrayBuffer(file.files[0]);
		});
	}

	function slicer(data, slice) {
		return new Uint8Array(data.slice(slice[0], slice[1] + 1));
	}

	function isRangeBlank(builtArray) {
		return builtArray.reduce((result, value) => {
			return result && value === 0;
		}, true);
	}

	function savePropertiesBuilder(bin, fileProperties, fileName = undefined) {

		var topBlock = slicer(bin, caliBlockTop);
		var botBlock = slicer(bin, caliBlockBot);
		var inCardName = slicer(bin, cardNameAdr);

		console.log(`inCardName is '${inCardName}'`);
		console.log("Beginning property building...");

		if (JSON.stringify(topBlock) === JSON.stringify(botBlock)) {
			var inCaliHead = slicer(bin, caliHeaderLoAdr);
			var inCaliData = slicer(bin, caliDataLoAdr);
		} else {
			fileProperties["caliValid"] = false;
			console.log("Corrupted Save.");
			var inCaliHead = undefined;
		}

		if (fileProperties["fileName"] === undefined) {
			fileProperties["fileName"] = fileName;
		}
		console.log("Updated fileProperties are:");
		console.log(fileProperties);
		// Does this set the property to false every time it checks a single item?
		try {
			if (JSON.stringify(inCaliHead) === JSON.stringify(caliHead)) {
				fileProperties["caliValid"] = true;
				fileProperties["caliData"] = inCaliData;
			} else {
				console.log("Calibration header not matching what was expected.");
				fileProperties["caliValid"] = false;
			}
		} catch (typeError) {
			fileProperties["caliValid"] = false;
		}

		console.log("Updated fileProperties are:");
		console.log(fileProperties);

		if (isRangeBlank(inCardName)) {
			fileProperties["cardValid"] = false;
		} else {
			fileProperties["cardValid"] = true;
			fileProperties["cardName"] = enc.decode(nameStripper(inCardName));
		}

		console.log("Final fileProperties are:");
		console.log(fileProperties);
	}

	function caliBuilder(caliArray) {

		const dataSlice = new Uint8Array(slicer(caliArray, caliDataLoAdr));
		const calibrationBlockSingle = new Uint8Array([...caliHead, ...dataSlice, ...caliBadFlag]);
		const blank = new Uint8Array(Array(4000).fill(null));

		return new Uint8Array([...calibrationBlockSingle, ...blank, ...calibrationBlockSingle]);
	}

	function patcher() {
		var outputArray = new Uint8Array();

		var inputTop = new Uint8Array(slicer(inputArray, fileTop));
		var inputBottom = new Uint8Array(slicer(inputArray, fileBottom));

		outputArray = [...inputTop, ...caliBuilder(caliArray), ...inputBottom];

		patchedArray = outputArray;
		return outputArray;
	}

	function fileOut(outputArray, fileName) {
		const blob = new Blob([new Uint8Array(outputArray)], {
			type: "application/octet-stream",
		});

		const url = URL.createObjectURL(blob);

		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	function fileVisualiser(inFileProperties, outNameID, outHeaderID, outDataID) {
		try {
			console.log(`Card name appears to be ${inFileProperties["cardName"]}`);
		} catch (typeError) {
			console.log("Invalid card on save file.");
		}

		if (inFileProperties["cardValid"]) {
			document.getElementById(outNameID).innerText = inFileProperties["cardName"];
		} else {
			document.getElementById(outNameID).innerText = "No e-card found in save.";
		}

		if (inFileProperties["caliValid"]) {
			document.getElementById(outHeaderID).innerText = "True";
			document.getElementById(outDataID).innerText = arrayToFormattedHex(inFileProperties["caliData"]);
		} else {
			document.getElementById(outHeaderID).innerText = "False";
			document.getElementById(outDataID).innerText = "Null";
		}
	}

	function blankFileVisualiser(outNameID, outHeaderID, outDataID) {
		document.getElementById(outNameID).innerText = "Load a save.";
		document.getElementById(outHeaderID).innerText = "Load a save.";
		document.getElementById(outDataID).innerText = "Load a save.";
	}
	
	calibrationFile.addEventListener("change", async function () {
		try {
			const { fileName, data } = await saveArrayBuilder(calibrationFile);
			caliArray = data;
			savePropertiesBuilder(data, caliFileProperties, fileName);
			if (caliFileProperties["caliValid"]) {
				fileVisualiser(caliFileProperties, "caliCardName", "caliHeaderValid", "caliCaliData");
				filesSelected["caliF"] = true;
				enableButton(filesSelected, patchButton);
			} else {
				console.log("Invalid file. no calibration data in save.");
				alert("Invalid calibration data in provided file. Calibration Save File must contain valid calibration data.");
				calibrationFile.value = "";
				blankFileVisualiser("caliCardName", "caliHeaderValid", "caliCaliData");
			}
		} catch (error) {
			console.error("Error occurred:", error);
		}
	});

	inputFile.addEventListener("change", async function () {
		try {
			const { fileName, data } = await saveArrayBuilder(inputFile);
			inputArray = data;
			savePropertiesBuilder(data, inputFileProperties, fileName);
			if (inputFileProperties["cardValid"]) {
				fileVisualiser(inputFileProperties, "inputCardName", "inputHeaderValid", "inputCaliData");
				filesSelected["inputF"] = true;
				enableButton(filesSelected, patchButton);
			} else {
				// Generate alert for invalid file.
				console.log("Invalid file. no e-card in save.");
				alert("Invalid e-card data in provided file. Input Save File must contain valid e-card data.");
				inputFile.value = "";
				blankFileVisualiser("inputCardName", "inputHeaderValid", "inputCaliData");
				// Clear file from input.
			}
		} catch (error) {
			console.error("Error occurred:", error);
		}
	});

	submitButton.addEventListener("click", function () {
		namer(); // Call the namer function to update the fileName variable
		downloadValid["nameSet"] = true;
		outputFileProperties["fileName"] = fileName;
		enableButton(downloadValid, downloadButton);
		submitTest();
	});

	patchButton.addEventListener("click", async function () {
		try {
			patchedArray = patcher(caliArray, inputArray);
			savePropertiesBuilder(patchedArray, outputFileProperties);
			fileVisualiser(outputFileProperties, "outputCardName", "outputHeaderValid", "outputOutputData");
			downloadValid["filesPatched"] = true;
			enableButton(downloadValid, downloadButton);
		} catch (error) {
			console.error("Error occurred:", error);
		}
	});

	downloadButton.addEventListener("click", function () {
		console.log(outputFileProperties);
		fileOut(patchedArray, fileName);
	});

	window.submitTest = submitTest;
});
