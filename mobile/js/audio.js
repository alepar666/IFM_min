var currentNowPlayingUrl;
var nowPlayingRequestTimer;
var selectedChannel;
var stations;

const NOW_PLAYING_REQUEST_TIMEOUT_MSEC = 4000;
const NOW_PLAYING_REQUEST_PREFIX = 'https://www.intergalactic.fm/now-playing?channel=';
const NOW_PLAYING_PICTURE_REQUEST_PREFIX = 'https://www.intergalactic.fm/channel-content/';
const NOW_PLAYING_DIV_ID = 'nowPlaying';
const TRACK_META_DIV_ID = 'track-meta';
const NOW_PLAYING_DIV_EXT_ID = 'nowPlayingExt';
const NOW_PLAYING_COVER_DIV_ID = 'nowPlayingCover';
const EMPTY_VAL = '';
const SPACE = ' ';
const META_TAGS_SPLIT_CHAR = '|';
const LINE_BREAK = '<br>';
const PAGE_TITLE_DEFAULT = 'Intergalactic FM';
const CBS_BUTTON_ID = 'cbsChannelButton';
const DF_BUTTON_ID = 'dfChannelButton';
const TDM_BUTTON_ID = 'tdmChannelButton';
const STATIONS_BUTTON_ID_LIST = [CBS_BUTTON_ID, DF_BUTTON_ID, TDM_BUTTON_ID];
const STOP_BUTTON_ID = 'stopButton';
const COVER_PATH = "img/logo128.png";
const CBS_COVER_PATH = "img/cbs128.png";
const DF_COVER_PATH = "img/df128.png";
const TDM_COVER_PATH = "img/tdm128.png";
const COVER_PATH_ARRAY = [CBS_COVER_PATH, DF_COVER_PATH, TDM_COVER_PATH];
const ARTIST_TITLE_SPLIT_STRING = ' - ';
const METADATA_SPLIT_CHAR = '|';
const NEXT_TRACK_ACTION_NAME = 'nexttrack';
const PREVIOUS_TRACK_ACTION_NAME = 'previoustrack';
const PLAY_ACTION_NAME = 'play';
const PAUSE_ACTION_NAME = 'pause';
const STOP_ACTION_NAME = 'stop';
const AUDIO_CONTROLS_KEY = 'controls';
const AUDIO_EVENT_PLAYING_NAME = 'playing';
const AUDIO_EVENT_PAUSE_NAME = 'pause';
const AUDIO_EVENT_ERROR_NAME = 'error';
const AUDIO_PLAYER_SOURCE_ID = 'audioPlayerSource';
const LOADING_MSG = 'Loading ';
var previousTrackTitle = EMPTY_VAL;
var previousExtractedCoverHTML = EMPTY_VAL;
var nowPlayingMetadatas = {
    "artist": "",
    "title": "",
    "album": "",
    "label": "",
    "year": "",
    "country": "",
    "ifmxLog": ""
}

// channel button actions
document.getElementById("cbsChannelButton").addEventListener("click",
    function () {
        playChannel(0);
    });
document.getElementById("dfChannelButton").addEventListener("click",
    function () {
        playChannel(1);
    });
document.getElementById("tdmChannelButton").addEventListener("click",
    function () {
        playChannel(2);
    });

// stop button
document.getElementById(STOP_BUTTON_ID).addEventListener("click", function () {
    stopAudio();
    reset();
});

function stopAudio() {
    AUDIO_CBS.pause();
    AUDIO_DF.pause();
    AUDIO_TDM.pause();
}


function playChannel(channelNumber) {

    stopAudio();

    clearTimeout(nowPlayingRequestTimer);
    selectedChannel = channelNumber;
    var audio = AUDIO_PLAYERS[channelNumber];
    audio.play();

    try {
        previousExtractedCoverHTML = EMPTY_VAL;
        var channelTitle = fetchedStations[channelNumber].title;
        displayMessage(LOADING_MSG + channelTitle + "...");
        currentNowPlayingUrl = NOW_PLAYING_REQUEST_PREFIX + channelTitle;
        getNowPlaying();
    } catch (exception) {
        console.log(exception);
    }
    setLockscreenControls(channelNumber);
}

function setLockscreenControls(channelNumber) {
    if ("mediaSession" in navigator) {

        // play / pause / stop lockscreen commands
        navigator.mediaSession.setActionHandler(PLAY_ACTION_NAME, () => {
            playChannel(channelNumber);
        });
        navigator.mediaSession.setActionHandler(PAUSE_ACTION_NAME, () => {
            stopAudio();
        });

        // next track / previous track lockscreen commands
        var nextIndex = channelNumber + 1;
        var previousIndex = channelNumber - 1;
        if (channelNumber == 0) {
            navigator.mediaSession.setActionHandler(PREVIOUS_TRACK_ACTION_NAME, null);
            navigator.mediaSession.setActionHandler(NEXT_TRACK_ACTION_NAME, () => {
                playChannel(nextIndex);
            });
        } else
        if (channelNumber == 1) {
            navigator.mediaSession.setActionHandler(PREVIOUS_TRACK_ACTION_NAME, () => {
                playChannel(previousIndex);
            });
            navigator.mediaSession.setActionHandler(NEXT_TRACK_ACTION_NAME, () => {
                playChannel(nextIndex);
            });
        } else
        if (channelNumber == 2) {
            navigator.mediaSession.setActionHandler(NEXT_TRACK_ACTION_NAME, null);
            navigator.mediaSession.setActionHandler(PREVIOUS_TRACK_ACTION_NAME, () => {
                playChannel(previousIndex);
            });
        }
        // coming back from lockscreen action 
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
                // no action  
            }
        });
    }
}

// request now playing from IFM server every NOW_PLAYING_REQUEST_TIMEOUT_MSEC
async function getNowPlaying() {
    try {
        const response = await fetch(currentNowPlayingUrl);
        const trackMetadata = await response.json();

        if (trackMetadata) {
            if (previousTrackTitle != trackMetadata.title) {
                setTrackMetadata(trackMetadata);
                var newTrack = trackMetadata.title;
                previousTrackTitle = newTrack;
                feedNowPlaying(newTrack);
                extractCoverFromChannelContent();
            }
        }
        nowPlayingRequestTimer = setTimeout(getNowPlaying, NOW_PLAYING_REQUEST_TIMEOUT_MSEC);
    } catch (error) {
        console.log(error);
        reset();
        displayMessage(error);
    }
}

// example of structure of the return string "OMICRON - Positron | The Generation and Motion of a Pulse | Instinct Ambient | 1995 | US | Electronix Surveillance * Insta: @intergalacticfm *  "
function setTrackMetadata(trackMetadata) {
    if (trackMetadata) {
        const trackMetadatas = trackMetadata.title.split(METADATA_SPLIT_CHAR);
        var notCorrupted = trackMetadatas[0].includes(ARTIST_TITLE_SPLIT_STRING);
        var manydash = (trackMetadatas[0].match(/-/g) || []).length != 1;
        var artist_title = trackMetadatas[0];
        var artist = artist_title;
        var title = "";
        if (notCorrupted && !manydash) {
            artist = artist_title.split(ARTIST_TITLE_SPLIT_STRING)[0].trim();
            title = artist_title.split(ARTIST_TITLE_SPLIT_STRING)[1].trim();
        }

        var album = trackMetadatas[1] ? trackMetadatas[1].trim() : EMPTY_VAL;
        var label = trackMetadatas[2] ? trackMetadatas[2].trim() : EMPTY_VAL;
        var year = trackMetadatas[3] ? trackMetadatas[3].trim() : EMPTY_VAL;
        var country = trackMetadatas[4] ? trackMetadatas[4].trim() : EMPTY_VAL;
        var ifmxLog = trackMetadatas[5] ? trackMetadatas[5].trim() : DEFAULT_SCROLLING_TEXT;

        nowPlayingMetadatas.artist = artist;
        nowPlayingMetadatas.title = title;
        nowPlayingMetadatas.album = album;
        nowPlayingMetadatas.label = label;
        nowPlayingMetadatas.year = year;
        nowPlayingMetadatas.country = country;

        setScrollingText(ifmxLog);
        var coverPath = COVER_PATH_ARRAY[selectedChannel];

        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: artist,
                album: album,
                artwork: [{
                    src: coverPath
                }]
            });
        }
    }
}

// populate the now playing html
function feedNowPlaying(title) {

    var fields = title.split(META_TAGS_SPLIT_CHAR);
    var main = nowPlayingMetadatas.artist + ARTIST_TITLE_SPLIT_STRING + nowPlayingMetadatas.title;
    var otherInfo = (nowPlayingMetadatas.album !== '' ? nowPlayingMetadatas.album : EMPTY_VAL) +
        (nowPlayingMetadatas.year !== '' ? ARTIST_TITLE_SPLIT_STRING + nowPlayingMetadatas.year : EMPTY_VAL) +
        (nowPlayingMetadatas.country !== '' ? " , " + nowPlayingMetadatas.country : EMPTY_VAL);

    feedHTML(NOW_PLAYING_DIV_ID, main);
    feedHTML(NOW_PLAYING_DIV_EXT_ID, otherInfo);

    var modal = document.getElementById("trackInfoModal");
    var homeContainer = document.getElementById('container');
    // Get the button that opens the modal
    var btn = document.getElementById("myBtn");
    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];
    // When the user clicks the button, open the modal 
    hideElement(homeContainer);
    showElement(modal);
    // When the user clicks on <span> (x), close the modal
    span.onclick = function () {
        hideElement(modal);
        showElement(homeContainer);
    }

}

/* cover and track info are fetched from intergalactic.fm, but need parsing */
async function extractCoverFromChannelContent(attempt) {
    if (attempt >= 10) {
        // recursion guard
        return;
    }
    var requestUrl = NOW_PLAYING_PICTURE_REQUEST_PREFIX + (selectedChannel + 1);
    var response = await fetch(requestUrl);
    var body = await response.text();
    var extractedCoverHTML = extractCoverFromHTML(body);
    //console.log("GETTING ARTWORK...");
    if (extractedCoverHTML != previousExtractedCoverHTML) {
        //console.log("NEW ARTWORK!");
        previousExtractedCoverHTML = extractedCoverHTML;

        // clean IFM inherited website styling and replace blanco img on error with local one
        var extractedCleanCoverHTML = extractedCoverHTML.replace('class="mr-3 air-time-image"', '').replace('https://www.intergalactic.fm/sites/default/files/covers/blanco.png', 'img/blanco.png').replace('onerror=null;', '').replace('style="object-fit: scale-down"', '').replace('width="100"', 'width="100%"').replace('height="100"', 'height="100%"');
        feedHTML(NOW_PLAYING_COVER_DIV_ID, extractedCleanCoverHTML);
    } else {
        //console.log("STILL OLD ARTWORK!");
        /* main website updates the cover with some delay, so we might request it multiple times before getting the updated one */
        //console.log("RETRYING...");
        setTimeout(function () {
            extractCoverFromChannelContent(attempt + 1);
        }, 2000);

    }
}

function extractCoverFromHTML(body) {
    var startOfCoverImgIndex = body.indexOf('<img');
    var endOfCoverImgIndex = body.indexOf('alt=""/>') + 10;
    return body.substring(startOfCoverImgIndex, endOfCoverImgIndex);
}

function reset() {
    feedHTML(NOW_PLAYING_DIV_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_DIV_EXT_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_COVER_DIV_ID, EMPTY_VAL);
    clearTimeout(nowPlayingRequestTimer);
    previousTrackTitle = EMPTY_VAL;
    previousExtractedCoverHTML = EMPTY_VAL;
    selectedChannel = EMPTY_VAL;
    document.title = PAGE_TITLE_DEFAULT;
    var modal = document.getElementById("trackInfoModal");
    var homeContainer = document.getElementById('container');
    hideElement(modal);
    fetchStations();
    showElement(homeContainer);
    setScrollingText(DEFAULT_SCROLLING_TEXT);
}

function feedHTML(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}
