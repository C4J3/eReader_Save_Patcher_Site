// Reads specific addresses in the savbin and pulls out the contents of them.
function binDataScraper(nameOutputID, caliOutputID) 
{
    // Addresses for the event name and the calibration data.
    var eNameStart =    0x10004;
    var eNameEnd =      0x1001F;
    var caliStart =     0xD000;
    var caliEnd =       0xD05F;

    // A reader function as a variable for easier usage?
    var reader = new FileReader();

    // Make the reader do stuff when an event happens?
    reader.onload = function (event) 
    {
        // Get the content of the file
        var content = event.target.result;

        // Extract the desired part of the content
        var eCardName = content.substring(eNameStart, eNameEnd);
        var caliData = content.substring(caliStart, caliEnd);
        
        // Get the part of the doc we want to display the output and display it there.
        var nameOut = document.getElementById(nameOutputID);
        var caliOut = document.getElementById(caliOutputID);
        nameOut.innerText = eCardName;
        caliOut.innerText = caliData;

        console.log(nameOutputID)
        console.log(caliOutputID)
    };

}

// Function to use the scraper for the calibration file. Idea is on file selected we scan the file for calibration data and an event card that we can display.
function califThinger()
{
    document.getElementById('calif').addEventListener('click', binDataScraper("caliCardName", "caliCaliData"))
}

function test()
{

}