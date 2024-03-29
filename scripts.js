// Wait until page has loaded
document.addEventListener('DOMContentLoaded', function () {

    // Define my ranges I want to use.
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

    
    function readRange(start, end, data) {
        var startOffset = start - 0;
        var length = end - start + 1;
        return new Uint8Array(data.slice(startOffset, startOffset + length));
    }

    // Read the savbins and do stuff and things.
    function binDataScraper(inFile, outNameID, outHeaderID, outDataID) {

        // fileInput variable is the file we pass in from the inputId variable.
        var fileInput = document.getElementById(inFile)

        // If file is a file and is more than 0 bytes long do things. Otherwise write to the log that we have no file.
        if ('files' in fileInput && fileInput.files.length > 0) {
            var file = fileInput.files[0];
            var reader = new FileReader();

            // Don't fully understand. On loading of the reader function with a suitable event (the change of the file in this case?) actually read the contents of the file?
            reader.onload = function (event) {
                var fileCont = event.target.result;

                function arrayBuilder(data, range) {
                    return new Uint8Array(data.slice(range[0], (range[1]+1)))
                }

                var fileCaliHead = arrayBuilder(fileCont, caliHeaderLoAdr);
                var file

                // Function to check if bytes within a range are blank
                function isRangeBlank(builtArray) {
                    return builtArray.reduce((result, value) => {
                        return result && (value === 0);
                    }, true);
                }

                // Function to read and return bytes within a range


                // Check if the part of the save file that should have the name of the card it read has the name of a card it read.
                var hasCard = isRangeBlank(cardNameAdr);
                if (hasCard) {
                    document.getElementById(outNameID).innerText = 'No card found in save.';
                } else {
                    var cardName = readRange(cardNameAdr[0], cardNameAdr[1], fileCont);
                    document.getElementById(outNameID).innerText = 'Card on save file is called: ' + enc.decode(cardName);
                }


                console.log("Card header is: '"+enc.decode(fileCaliHead)+"'. ","Expected header is: '"+enc.decode(caliHead)+"'. ")
                if (fileCaliHead != caliHead) {
                    document.getElementById(outHeaderID).innerText = 'Invalid calibration Data.';
                    document.getElementById(outDataID).innerText = '';

                } else {
                    document.getElementById(outHeaderID).innerText = 'Calibration data looks good!';

                    // Convert calibration data to two-character hexadecimal values
                    var cDataHex = '';
                    var cData = readRange(caliDataLoAdr[0], caliDataLoAdr[1], fileCont);
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

            reader.readAsArrayBuffer(file);

            console.log("Read file: " + file.name+ " succesfully")
        } else {
            console.log('No file selected.');
        }
    }

    // Update calif file information when the file is updated.
    calibrationFile.addEventListener('change', function () {
        binDataScraper('calif', 'caliCardName', 'caliHeaderValid', 'caliCaliData');
    });

    // Update inputf file information when the file is updated.
    inputFile.addEventListener('change', function () {
        binDataScraper('inputf', 'inputCardName', 'inputHeaderValid', 'inputCaliData');
    });

    document.getElementById('test').addEventListener('click', function () {
        binDataScraper('calif', 'caliCardName', 'caliHeaderValid', 'caliCaliData');
        binDataScraper('inputf', 'inputCardName', 'inputHeaderValid', 'inputCaliData');
    });

    function patcher()
    {
        var savbin = stringToHex("Card-E Reader 2001")+readRange(caliDataLoAdr[0], caliDataLoAdr[1])
        console.log(savbin)
    }
});
