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

const AUDIO_CBS = document.getElementById(PLAYER_CBS_ID);
const AUDIO_DF = document.getElementById(PLAYER_DF_ID);
const AUDIO_TDM = document.getElementById(PLAYER_TDM_ID);

const AUDIO_PLAYERS = [AUDIO_CBS, AUDIO_DF, AUDIO_TDM];

var fetchedStations;

window.onload = function () {
    if (!fetchedStations) {
        fetchStations();
    }
    setScrollingText(DEFAULT_SCROLLING_TEXT);
};

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
    var stations = [
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
    this.fetchedStations = stations;

    // TODO: deactivate button if in error, reactivate at load
    AUDIO_CBS.onerror = function () {
        // deactivate CBS
        alert("CBS stream is not available.");
        disableChannel(CBS_BUTTON_ID);
    };
    AUDIO_DF.onerror = function () {
        // deactivate DF
        alert("Disco Fetish stream is not available.");
        disableChannel(DF_BUTTON_ID);
    };
    AUDIO_TDM.onerror = function () {
        // deactivate TDM
        alert("The Dream Machine stream is not available.");
        disableChannel(TDM_BUTTON_ID);
    };

    // preload aggressively
    AUDIO_CBS.src = cbsInfo.url;
    AUDIO_CBS.load();
    AUDIO_DF.src = dfInfo.url;
    AUDIO_DF.load();
    AUDIO_TDM.src = tdmInfo.url;
    AUDIO_TDM.load();

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
