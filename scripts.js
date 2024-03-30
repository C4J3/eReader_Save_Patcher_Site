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

    var fileName = new String("default");
    //var completeCali = caliHead.concat(function())
    var enc = new TextDecoder("utf-8")

    var calibrationFile = document.getElementById('calif');
    var inputFile = document.getElementById('inputf');
    var outputFile = document.getElementById('outf');

// 4 arrays. File top, calLow to begin of calHi, CalHi, Rest of file.
    function namer() {
        function submitName() {
            var fileName = outputFile.value;
            console.log("File name submitted: "+fileName);
            return fileName;
        }
    }

    function arrayToHexFormatted(uint8Array) {
        return Array.from(uint8Array, byte => byte.toString(16).padStart(2, '0').toUpperCase()).join(' ');
    }

    function saveBuilder(file) {
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

    function caliBuilder(caliArray) {
        var dataSlice = new Uint8Array(slicer(caliArray, caliDataLoAdr));
        var calibrationBlockSingle = new Uint8Array([...caliHead, ...dataSlice, ...caliBadFlag]);
        const blank = new Uint8Array(Array(4000).fill(null));
        var calibrationBlockFull = new Uint8Array([...calibrationBlockSingle, ...blank, ...calibrationBlockSingle]);
        console.log(arrayToHexFormatted(calibrationBlockFull));

        return calibrationBlockFull
    }

    function patcher(caliFile, inputFile) {
        var outputArray = new Uint8Array();

        var inputTop = new Uint8Array(slicer(inputFile, fileTop));
        var inputBottom = new Uint8Array(slicer(inputFile, fileBottom));

        outputArray = [...inputTop, ...caliBuilder(caliFile), ...inputBottom];

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
        var inCardName = slicer(inArray, cardNameAdr)
        
        if (isRangeBlank(inCardName)) {
            document.getElementById(outNameID).innerText = 'No card found in save.';
        } else {
            document.getElementById(outNameID).innerText = 'Card on save file is called: ' + enc.decode(inCardName);
        }

        console.log("Card header is: '" + enc.decode(inCaliHead) + "'. ", "Expected header is: '" + enc.decode(caliHead) + "'. ")

        // Comparing Uint8Array content
        let isValidHeader = true;
        for (let i = 0; i < caliHead.length; i++) {
            if (inCaliHead[i] !== caliHead[i]) {
                isValidHeader = false;
                break;
            }
        }

        if (!isValidHeader) {
            document.getElementById(outHeaderID).innerText = 'Invalid calibration Data.';
            document.getElementById(outDataID).innerText = '';
        } else {
            document.getElementById(outHeaderID).innerText = 'Calibration data looks good!';
            document.getElementById(outDataID).innerText = 'Calibration data is: ' + arrayToHexFormatted(inCaliData);
            }
        };

    document.getElementById('test').addEventListener('click', async function () {
        try {
            var calibrationArray = await saveBuilder(calibrationFile); // Wait for the promise to resolve
            var inputArray = await saveBuilder(inputFile);
            pageDisplay(calibrationArray, 'caliCardName', 'caliHeaderValid', 'caliCaliData');
            pageDisplay(inputArray, 'inputCardName', 'inputHeaderValid', 'inputCaliData');
        } catch (error) {
            console.error('Error occurred:', error);
        }
    });

    document.getElementById('patch').addEventListener('click', async function () {
        try {
            var calibrationArray = await saveBuilder(calibrationFile); // Wait for the promise to resolve
            var inputArray = await saveBuilder(inputFile);
            patcher(calibrationArray, inputArray)
        } catch (error) {
            console.error('Error occurred:', error);
        }
    });

    document.getElementById('download').addEventListener('click', async function () {
        try {
            var calibrationArray = await saveBuilder(calibrationFile); // Wait for the promise to resolve
            var inputArray = await saveBuilder(inputFile);
            fileOut(patcher(calibrationArray, inputArray), 'CARDE READER [PSAE01].sav')
        } catch (error) {
            console.error('Error occurred:', error);
        }
    });
});