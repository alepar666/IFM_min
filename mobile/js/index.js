// where all streaming url and radio info are fetched from
const STATIONS_JSON_URL = 'https://intergalactic.fm/sd/stations.json';
const DISPLAY_MESSAGE_BOX_ID = 'messageBox';
const DONATE_URL = 'https://www.paypal.com/donate/?hosted_button_id=MV4HVU2D4W3LJ';
const WEBSITE_URL = 'https://intergalactic.fm/';
const ARCHIVE_URL = 'https://videohotmix.net/';
const DEFAULT_SCROLLING_TEXT = 'INTERGALACTIC FM SPACE TRAVELS APP';

const PLAYER_CBS_ID = 'playerCBS';
const PLAYER_DF_ID = 'playerDF';
const PLAYER_TDM_ID = 'playerTDM';

const CBS_AUDIO_PLAYER = document.getElementById(PLAYER_CBS_ID);
const DF_AUDIO_PLAYER = document.getElementById(PLAYER_DF_ID);
const TDM_AUDIO_PLAYER = document.getElementById(PLAYER_TDM_ID);
const AUDIO_PLAYERS = [CBS_AUDIO_PLAYER, DF_AUDIO_PLAYER, TDM_AUDIO_PLAYER];
const AUDIO_PLAYER = document.getElementById('player');

var fetchedStations;
let audioContext;

window.onload = function () {
    if (!fetchedStations) {
        fetchStations();
    }
    setScrollingText(DEFAULT_SCROLLING_TEXT);
    // unlock iOS audio context
    if (!audioContext) {
        audioContext = new(window.AudioContext || window.webkitAudioContext)();
    }
};

// prevents back button of android to stop music in background
document.addEventListener('backbutton', function () {
    // Your custom logic here
    // For example, pause the music or navigate to a previous screen
    if (isPlaying) {
        //pauseMusic(); // Custom function to pause music
        alert("STILL PLAYING BIATCH");
    } else {
        // Optionally, you can navigate back or exit the app
        navigator.app.backHistory(); // Go back in history
    }
}, false);

// prevents lockscreen to stop audio
document.addEventListener('deviceready', function () {
    // Enable background mode
    cordova.plugins.backgroundMode.enable();

    // Optional: Listen for background mode events
    cordova.plugins.backgroundMode.on('activate', function () {
        // This will be called when the background mode is activated
        // You can pause or resume your audio here if needed
    });

    cordova.plugins.backgroundMode.on('deactivate', function () {
        // This will be called when the background mode is deactivated
    });
}, false);




// page links actions
document.getElementById("donateRedirect").addEventListener("click",
    function () {
        window.location.href = DONATE_URL;
    });

document.getElementById("websiteRedirect").addEventListener("click",
    function () {
        window.location.href = WEBSITE_URL;
    });

document.getElementById("archiveRedirect").addEventListener("click",
    function () {
        window.location.href = ARCHIVE_URL;
    });

/* requests stations info and stream url from IFM server STATIONS_JSON_URL */
async function fetchStations() {

    const response = await fetch(STATIONS_JSON_URL).then((response) => {
        if (response.status >= 400 && response.status < 600) {
            var errorMessage = "Unable to load the playlist: " + response.status + " - " +
                response.statusText;
            displayMessage(errorMessage);
        }
        return response;
    });


    const stationsJson = await response.json();
    var cbsInfo = stationsJson.stations[0];
    var dfInfo = stationsJson.stations[1];
    var tdmInfo = stationsJson.stations[2];

    // init radio
    fetchedStations = [
        {
            title: cbsInfo.name,
            src: cbsInfo.url,
            howl: null
                },
        {
            title: dfInfo.name,
            src: dfInfo.url,
            howl: null
                },
        {
            title: tdmInfo.name,
            src: tdmInfo.url,
            howl: null
                    }
                ];
    // preload
    /*
    CBS_AUDIO_PLAYER.src = cbsInfo.url;
    CBS_AUDIO_PLAYER.load();
    DF_AUDIO_PLAYER.src = dfInfo.url;
    DF_AUDIO_PLAYER.load();
    TDM_AUDIO_PLAYER.src = tdmInfo.url;
    TDM_AUDIO_PLAYER.load();
    */

    // playlist loaded successfuly
    displayMessage("System ready.<br> Select a channel to play.");
}


function setScrollingText(textForScrolling) {
    document.getElementsByClassName("ifmxScrollText")[0].innerHTML = textForScrolling;
}

function displayMessage(message) {
    feedHTML(DISPLAY_MESSAGE_BOX_ID, message);
}

function feedHTML(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}

function showElement(element) {
    element.style.display = "block";
}

function hideElement(element) {
    element.style.display = "none";
}

function disableChannel(channelButtonId) {
    document.getElementById(channelButtonId).style.display = "none";
}
