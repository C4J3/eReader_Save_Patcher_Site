function binDataScraper(inputId, outNameID, outHeaderID, outDataID) {
    var fileInput = document.getElementById(inputId);

    if ('files' in fileInput && fileInput.files.length > 0) {
        var file = fileInput.files[0];
        var reader = new FileReader();

        reader.onload = function (event) {
            var fileData = event.target.result;

            // Define the first range: bytes from 0x10004 to 0x1001F
            var eNameStart = 0x10004;
            var eNameEnd = 0x1001F;
            var cHeaderStart = 0xD000;
            var cHeaderEnd = 0xD011;
            var cDataStart = 0xD012;
            var cDataEnd = 0xD04F;

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

            // Check if bytes from the first range are blank
            var eNameBlank = isRangeBlank(eNameStart, eNameEnd);
            if (eNameBlank) {
                document.getElementById(outNameID).innerText = 'Event name range is blank.';
            } else {
                var eName = readRange(eNameStart, eNameEnd);
                document.getElementById(outNameID).innerText = 'Event name is: ' + eName;
            }

            var cHeaderValid = readRange(cHeaderStart, cHeaderEnd);
            if (cHeaderValid != "Card-E Reader 2001") {
                document.getElementById(outHeaderID).innerText = 'Invalid calibration Data.';
            } else {
                document.getElementById(outHeaderID).innerText = 'Calibration data looks good!';

                // Convert calibration data to two-character hexadecimal values
                var cDataHex = '';
                var cData = readRange(cDataStart, cDataEnd);
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

function califThinger() {
    binDataScraper('calif', 'caliCardName', 'caliHeaderValid', 'caliCaliData');
}
