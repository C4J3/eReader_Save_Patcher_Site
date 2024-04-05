document.addEventListener("DOMContentLoaded", function () {
	const cardNameAdr = [0x10004, 0x1001f];
	const caliHeaderLoAdr = [0xd000, 0xd011];
	const caliDataLoAdr = [0xd012, 0xd04f];
	const caliHeaderHiAdr = [0xe000, 0xe011];
	const caliDataHiAdr = [0xe012, 0xe04f];
	const fileTop = [0x0, 0xcfff];
	const fileBottom = [0xe060, 0x20000];
	const caliHead = new Uint8Array([0x43, 0x61, 0x72, 0x64, 0x2d, 0x45, 0x20, 0x52, 0x65, 0x61, 0x64, 0x65, 0x72, 0x20, 0x32, 0x30, 0x30, 0x31]);
	const caliBadFlag = new Uint8Array([0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

	var patchedArray = new Uint8Array(null);
	var caliArray = new Uint8Array(null);
	var inputArray = new Uint8Array(null);
	var enc = new TextDecoder("utf-8");

	var filesSelected = {
		caliF: false,
		inputF: false,
	};

	var downloadValid = {
		filesPatched: false,
		nameSet: false,
	};

	var caliFileProperties = filePropertyBuilder();
	var inputFileProperties = filePropertyBuilder();
	var outputFileProperties = filePropertyBuilder();

	const calibrationFile = document.getElementById("caliF");
	const inputFile = document.getElementById("inputF");
	const outputFile = document.getElementById("outputF");
	const submitButton = document.getElementById("submitButton");
	const downloadButton = document.getElementById("downloadButton");
	const patchButton = document.getElementById("patchButton");

	function filePropertyBuilder() {
		return {
		fileName: undefined,
		caliValid: undefined,
		caliData: undefined,
		cardValid: undefined,
		cardName: undefined
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

	function checkOutfileInput() {
		// Check if text input is empty
		if (outputFile.value.trim() !== "") {
			// Enable the submit button
			submitButton.disabled = false;
		} else {
			// Disable the submit button
			submitButton.disabled = true;
		}
	}

	function enableDownload() {
		if (Object.values(downloadValid).every(Boolean)) {
			downloadButton.disabled = false;
		} else {
			downloadButton.disabled = true;
		}
	}

	function enablePatch() {
		if (Object.values(filesSelected).every(Boolean)) {
			patchButton.disabled = false; // Enable the patch button
		} else {
			patchButton.disabled = true; // Disable the patch button
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

	function savePropertiesBuilder(cali, fileName, fileProperties) {
		var inCaliHead = slicer(cali, caliHeaderLoAdr);
		console.log(`inCaliHead is ${inCaliHead}`);
		var inCaliData = slicer(cali, caliDataLoAdr);
		console.log(`inCaliData is ${inCaliData}`);
		var inCardName = slicer(cali, cardNameAdr);
		console.log(`inCardName is ${inCardName}`);

		console.log("Beginning property building:");
		console.log(fileProperties);
		fileProperties["fileName"] = fileName;

		// Does this set the property to false every time it checks a single item?
		for (let i = 0; i < caliHead.length; i++) {
			if (inCaliHead[i] !== caliHead[i]) {
				fileProperties["caliValid"] = false;
			} else {
				fileProperties["caliValid"] = true;
				fileProperties["caliData"] = inCaliData;
			}
		}

		if (isRangeBlank(inCardName)) {
			fileProperties["cardValid"] = false;
		} else {
			fileProperties["cardValid"] = true;
			fileProperties["cardName"] = inCardName;
		}
	}

	function caliBuilder(caliArray) {
		var dataSlice = new Uint8Array(slicer(caliArray, caliDataLoAdr));
		var calibrationBlockSingle = new Uint8Array([...caliHead, ...dataSlice, ...caliBadFlag]);
		const blank = new Uint8Array(Array(4000).fill(null));
		var calibrationBlockFull = new Uint8Array([...calibrationBlockSingle, ...blank, ...calibrationBlockSingle]);

		return calibrationBlockFull;
	}

	function customPrint() {
		console.log(
			`Spam incoming.... \n
			Patched Array is: ${arrayToFormattedHex(patchedArray)}.\n
			Calibration Array is: ${arrayToFormattedHex(caliArray)}.\n
			Input Array is: ${arrayToFormattedHex(inputArray)}.`
		);
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
			console.log(`Card name appears to be ${enc.decode(nameStripper(inFileProperties["cardName"]))}`);
		} catch (typeError) {
			console.log("Invalid card on save file.");
		}

		if (inFileProperties["cardValid"]) {
			document.getElementById(outNameID).innerText = enc.decode(inFileProperties["cardName"]);
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

	document.getElementById("caliF").addEventListener("change", async function () {
		try {
			const { fileName, data } = await saveArrayBuilder(calibrationFile);
			savePropertiesBuilder(data, fileName, caliFileProperties);
			console.log(`caliFileProperties are:`);
			console.log(caliFileProperties);
			if (caliFileProperties["caliValid"]) {
				fileVisualiser(caliFileProperties, "caliCardName", "caliHeaderValid", "caliCaliData");
				filesSelected["caliF"] = true;
				enablePatch();
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

	document.getElementById("inputF").addEventListener("change", async function () {
		try {
			const { fileName, data } = await saveArrayBuilder(inputFile);
			savePropertiesBuilder(data, fileName, inputFileProperties);
			console.log(`inputFileProperties are:`);
			console.log(inputFileProperties);
			if (inputFileProperties["cardValid"]) {
				fileVisualiser(inputFileProperties, "inputCardName", "inputHeaderValid", "inputCaliData");
				filesSelected["inputF"] = true;
				enablePatch();
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

	document.getElementById("submitButton").addEventListener("click", function () {
		namer(); // Call the namer function to update the fileName variable
		downloadValid["nameSet"] = true;
		enableDownload();
	});

	document.getElementById("patchButton").addEventListener("click", async function () {
		try {
			patchedArray = patcher(caliArray, inputArray);
			fileVisualiser(patchedArray, "outputCardName", "outputHeaderValid", "outputOutputData");
			downloadValid["filesPatched"] = true;
			enableDownload();
		} catch (error) {
			console.error("Error occurred:", error);
		}
	});

	document.getElementById("downloadButton").addEventListener("click", function () {
		fileOut(patchedArray, fileName);
	});

	window.checkOutfileInput = checkOutfileInput;
});
