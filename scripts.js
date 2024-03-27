// Wait until page has loaded
document.addEventListener('DOMContentLoaded', function () {

    // Read the savbins and do stuff and things.
    function binDataScraper(inputId, outNameID, outHeaderID, outDataID) {

        // fileInput variable is the file we pass in from the inputId variable.
        var fileInput = document.getElementById(inputId);

        // If file is a file and is more than 0 bytes long do things. Otherwise write to the log that we have no file.
        if ('files' in fileInput && fileInput.files.length > 0) {
            var file = fileInput.files[0];
            var reader = new FileReader();

            // Don't fully understand. On loading of the reader function with a suitable event (the change of the file in this case?) actually read the contents of the file?
            reader.onload = function (event) {
                var fileData = event.target.result;

                // Define my ranges I want to use.
                var eNameStart = 0x10004;
                var eNameEnd = 0x1001F;
                var cHeaderLoStart = 0xD000;
                var cHeaderLoEnd = 0xD011;
                var cDataLoStart = 0xD012;
                var cDataLoEnd = 0xD04F;
                var cHeaderHiStart = 0xE000;
                var cHeaderHiEnd = 0xE011;
                var cDataHiStart = 0xE012;
                var cDataHiEnd = 0xE04F;

                // Function to check if bytes within a range are blank
                function isRangeBlank(start, end) {
                    var startOffset = start - 0;
                    var length = end - start + 1;
                    var bytes = fileData.slice(startOffset, startOffset + length);

                    // Check if all bytes within the range are zero
                    for (var i = 0; i < bytes.length; i++) {
                        if (bytes.charCodeAt(i) !== 0) {
                            return false; // Non-zero byte found
                        }
                    }
                    return true; // All bytes are zero
                }

                // Function to read and return bytes within a range
                function readRange(start, end) {
                    var startOffset = start - 0;
                    var length = end - start + 1;
                    return fileData.slice(startOffset, startOffset + length);
                }

                // Check if the part of the save file that should have the name of the card it read has the name of a card it read.
                var eNameBlank = isRangeBlank(eNameStart, eNameEnd);
                if (eNameBlank) {
                    document.getElementById(outNameID).innerText = 'No card found in save.';
                } else {
                    var eName = readRange(eNameStart, eNameEnd);
                    document.getElementById(outNameID).innerText = 'Card on save file is called: ' + eName;
                }

                // Check if the part of the save file that should have calibration data has 'valid' calibration data.
                var cHeaderValid = readRange(cHeaderLoStart, cHeaderLoEnd);
                if (cHeaderValid != "Card-E Reader 2001") {
                    document.getElementById(outHeaderID).innerText = 'Invalid calibration Data.';
                } else {
                    document.getElementById(outHeaderID).innerText = 'Calibration data looks good!';

                    // Convert calibration data to two-character hexadecimal values
                    var cDataHex = '';
                    var cData = readRange(cDataLoStart, cDataLoEnd);
                    for (var i = 0; i < cData.length; i++) {
                        var hexValue = cData.charCodeAt(i).toString(16).toUpperCase();
                        if (hexValue.length === 1) {
                            hexValue = '0' + hexValue; // Pad with zero if necessary
                        }
                        cDataHex += hexValue + ' ';
                    }
                    document.getElementById(outDataID).innerText = 'Calibration data is: ' + cDataHex;
                }
            };

            reader.readAsBinaryString(file);
        } else {
            console.log('No file selected.');
        }
    }

    // Update calif file information when the file is updated.
    document.getElementById('calif').addEventListener('change', function () {
        binDataScraper('calif', 'caliCardName', 'caliHeaderValid', 'caliCaliData');
    });

    //Update inputf file information when the file is updated.
    document.getElementById('inputf').addEventListener('change', function () {
        binDataScraper('inputf', 'inputCardName', 'inputHeaderValid', 'inputCaliData');
    });

});
