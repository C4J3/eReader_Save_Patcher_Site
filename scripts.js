document.addEventListener('DOMContentLoaded', function () {

    var cardNameAdr = [0x10004, 0x1001F];
    var caliHeaderLoAdr = [0xD000, 0xD011];
    var caliDataLoAdr = [0xD012, 0xD04F];
    var caliHeaderHiAdr = [0xE000, 0xE011];
    var caliDataHiAdr = [0xE012, 0xE04F];
    var caliHead = new Uint8Array([0x43, 0x61, 0x72, 0x64, 0x2D, 0x45, 0x20, 0x52, 0x65, 0x61, 0x64, 0x65, 0x72, 0x20, 0x32, 0x30, 0x30, 0x31]);
    
    var enc = new TextDecoder("utf-8")
    
    var calibrationFile = document.getElementById('calif');
    var inputFile = document.getElementById('inputf');
    var outputFile = document.getElementById('outf');

    function arrayBuilder(data, slice) {
        return new Uint8Array(data.slice(slice[0], (slice[1] + 1)))
    }

    function binDataScraper(inFile, outNameID, outHeaderID, outDataID) {

        var fileInput = document.getElementById(inFile);
        var reader = new FileReader();

        reader.onload = function (event) {

            var fileCont = event.target.result;

            var fileCaliHead = arrayBuilder(fileCont, caliHeaderLoAdr);
            var fileCaliData = arrayBuilder(fileCont, caliDataLoAdr);
            var fileCardName = arrayBuilder(fileCont, cardNameAdr);

            function isRangeBlank(builtArray) {
                return builtArray.reduce((result, value) => {
                    return result && (value === 0);
                }, true);
            }

            if (isRangeBlank(fileCardName)) {
                document.getElementById(outNameID).innerText = 'No card found in save.';
            } 
            else {
                document.getElementById(outNameID).innerText = 'Card on save file is called: ' + enc.decode(fileCardName);
            }

            console.log("Card header is: '" + enc.decode(fileCaliHead) + "'. ", "Expected header is: '" + enc.decode(caliHead) + "'. ")

            // Comparing Uint8Array content
            let isValidHeader = true;
            for (let i = 0; i < caliHead.length; i++) {
                if (fileCaliHead[i] !== caliHead[i]) {
                    isValidHeader = false;
                    break;
                }
            }

            if (!isValidHeader) {
                document.getElementById(outHeaderID).innerText = 'Invalid calibration Data.';
                document.getElementById(outDataID).innerText = '';
            } else {
                function arrayToHexFormatted(uint8Array) {
                    return Array.from(uint8Array, byte => byte.toString(16).padStart(2, '0')).join(' ');
                }
                document.getElementById(outHeaderID).innerText = 'Calibration data looks good!';
                document.getElementById(outDataID).innerText = 'Calibration data is: ' + arrayToHexFormatted(fileCaliData);
            }
        };

        // Read file before anything else
        reader.readAsArrayBuffer(fileInput.files[0]);
    }

    calibrationFile.addEventListener('change', function () {
        binDataScraper('calif', 'caliCardName', 'caliHeaderValid', 'caliCaliData');
    });

    inputFile.addEventListener('change', function () {
        binDataScraper('inputf', 'inputCardName', 'inputHeaderValid', 'inputCaliData');
    });

    document.getElementById('test').addEventListener('click', function () {
        binDataScraper('calif', 'caliCardName', 'caliHeaderValid', 'caliCaliData');
        binDataScraper('inputf', 'inputCardName', 'inputHeaderValid', 'inputCaliData');
    });
});
