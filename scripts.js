document.addEventListener('DOMContentLoaded', function () {

    const cardNameAdr = [0x10004, 0x1001F];
    const caliHeaderLoAdr = [0xD000, 0xD011];
    const caliDataLoAdr = [0xD012, 0xD04F];
    const caliHeaderHiAdr = [0xE000, 0xE011];
    const caliDataHiAdr = [0xE012, 0xE04F];
    const fileTop = [0x0, 0xCFFF];
    const fileBottom = [0xE060, 0x20000];
    const caliHead = new Uint8Array([0x43, 0x61, 0x72, 0x64, 0x2D, 0x45, 0x20, 0x52, 0x65, 0x61, 0x64, 0x65, 0x72, 0x20, 0x32, 0x30, 0x30, 0x31]);
    const caliBadFlag = new Uint8Array([0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

    var patchedArray = new Uint8Array(null);
    var caliArray = new Uint8Array(null);
    var inputArray = new Uint8Array(null);
    var fileName = new String(null);
    var enc = new TextDecoder("utf-8")

    var filesSelected = {
        'caliF': false,
        'inputF': false
    };

    const calibrationFile = document.getElementById('caliF');
    const inputFile = document.getElementById('inputF');
    const outputFile = document.getElementById('outputF');
    const submitButton = document.getElementById('submitButton')
    const downloadButton = document.getElementById('downloadButton')

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
        if (outputFile.value.trim() !== '') {
            // Enable the submit button
            submitButton.disabled = false;
        } else {
            // Disable the submit button
            submitButton.disabled = true;
        }
    }

    function enableDownload() {
        if (fileName !== null && fileName.trim() !== '' && patchedArray !== null) {
            downloadButton.disabled = false;
        } else {
            downloadButton.disabled = true;
        }
    }

    function arrayToFormattedHex(uint8Array) {
        return Array.from(uint8Array, byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    }

    function saveArrayBuilder(file) {
        return new Promise((resolve, reject) => {
            var reader = new FileReader();

            reader.onload = function (event) {
                var fileCont = event.target.result;
                resolve(new Uint8Array(fileCont)); // Resolve the promise with the result
            };
            reader.readAsArrayBuffer(file.files[0]);
        });
    }

    function slicer(data, slice) {
        return new Uint8Array(data.slice(slice[0], (slice[1] + 1)))
    }

    function isRangeBlank(builtArray) {
        return builtArray.reduce((result, value) => {
            return result && (value === 0);
        }, true);
    }

    function checkPatchButton() {
        const patchButton = document.getElementById('patch');
        if (filesSelected['caliF'] && filesSelected['inputF']) {
            patchButton.disabled = false; // Enable the patch button
        } else {
            patchButton.disabled = true; // Disable the patch button
        }
    }

    function caliBuilder(caliArray) {
        var dataSlice = new Uint8Array(slicer(caliArray, caliDataLoAdr));
        var calibrationBlockSingle = new Uint8Array([...caliHead, ...dataSlice, ...caliBadFlag]);
        const blank = new Uint8Array(Array(4000).fill(null));
        var calibrationBlockFull = new Uint8Array([...calibrationBlockSingle, ...blank, ...calibrationBlockSingle]);

        return calibrationBlockFull
    }

    function customPrint() {
        console.log(`Spam incoming.... \nPatched Array is: ${arrayToFormattedHex(patchedArray)}.\nCalibration Array is: ${arrayToFormattedHex(caliArray)}.\nInput Array is: ${arrayToFormattedHex(inputArray)}.`);
    }

    function patcher() {

        var outputArray = new Uint8Array();

        var inputTop = new Uint8Array(slicer(inputArray, fileTop));
        var inputBottom = new Uint8Array(slicer(inputArray, fileBottom));

        outputArray = [...inputTop, ...caliBuilder(caliArray), ...inputBottom];

        patchedArray = outputArray;
        return outputArray
    }

    function fileOut(outputArray, fileName) {

        const blob = new Blob([new Uint8Array(outputArray)], { type: 'application/octet-stream' });

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    function pageDisplay(inArray, outNameID, outHeaderID, outDataID) {

        var inCaliHead = slicer(inArray, caliHeaderLoAdr)
        var inCaliData = slicer(inArray, caliDataLoAdr)
        var inCardName = nameStripper(slicer(inArray, cardNameAdr))
        
        if (isRangeBlank(inCardName)) {
            document.getElementById(outNameID).innerText = 'No e-card found in save.';
        } else {
            document.getElementById(outNameID).innerText = enc.decode(inCardName);
        }

        console.log("Card header is: '" + arrayToFormattedHex(inCaliHead) + "'. ", "Expected header is: '" + arrayToFormattedHex(caliHead) + "'. ")

        // Comparing Uint8Array content
        let isValidHeader = true;
        for (let i = 0; i < caliHead.length; i++) {
            if (inCaliHead[i] !== caliHead[i]) {
                isValidHeader = false;
                break;
            }
        }

        if (!isValidHeader) {
            document.getElementById(outHeaderID).innerText = 'False';
            document.getElementById(outDataID).innerText = 'Null';
        } else {
            document.getElementById(outHeaderID).innerText = 'True';
            document.getElementById(outDataID).innerText = arrayToFormattedHex(inCaliData);
            }
        };

    document.getElementById('caliF').addEventListener('change', async function () {
        try {
            caliArray = await saveArrayBuilder(calibrationFile); // Wait for the promise to resolve
            pageDisplay(caliArray, 'caliCardName', 'caliHeaderValid', 'caliCaliData');
            filesSelected['caliF'] = true;
            checkPatchButton();
        } catch (error) {
            console.error('Error occurred:', error);
        }
    });

    document.getElementById('inputF').addEventListener('change', async function () {
        try {
            inputArray = await saveArrayBuilder(inputFile); // Wait for the promise to resolve
            pageDisplay(inputArray, 'inputCardName', 'inputHeaderValid', 'inputCaliData');
            filesSelected['inputF'] = true;
            checkPatchButton();
        } catch (error) {
            console.error('Error occurred:', error);
        }
    });

    document.getElementById('submitButton').addEventListener('click', function () {
        namer(); // Call the namer function to update the fileName variable
        enableDownload(); // Call enableDownload to enable/disable the download button
    });


    document.getElementById('patch').addEventListener('click', async function () {
        try {
            patchedArray = patcher(caliArray, inputArray)
            pageDisplay(patchedArray, 'outputCardName', 'outputHeaderValid', 'outputOutputData')
        } catch (error) {
            console.error('Error occurred:', error);
        }
    });

    document.getElementById('downloadButton').addEventListener('click', function () {
        fileOut(patchedArray, fileName)
    });

    window.checkOutfileInput = checkOutfileInput;
});