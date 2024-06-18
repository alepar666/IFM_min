const audio = document.getElementById('player');
const NOW_PLAYING_REQUEST_TIMEOUT_MSEC = 5000;
const NOW_PLAYING_REQUEST_PREFIX = 'https://www.intergalactic.fm/now-playing?channel=';
const NOW_PLAYING_PICTURE_REQUEST_PREFIX = 'https://www.intergalactic.fm/channel-content/';
const NOW_PLAYING_PICTURE_DEFAULT = 'https://www.intergalactic.fm/sites/default/files/covers/blanco.png';
const NOW_PLAYING_DIV_ID = 'nowPlaying';
const TRACK_META_DIV_ID = 'track-meta';
const NOW_PLAYING_DIV_EXT_ID = 'nowPlayingExt';
const NOW_PLAYING_COVER_DIV_ID = 'nowPlayingCover';
const AUDIO_PLAYER_SOURCE_ID = 'audioPlayerSource';
const ERROR_MSG = 'Error: ';
const STYLE = 'style';
const NO_INFO_MSG = 'No info available';
const META_TAGS_SPLIT_CHAR = '|';
const CBS_CHANNEL_ID = 'cbs';
const DF_CHANNEL_ID = 'df';
const TDM_CHANNEL_ID = 'tdm';
const channelsId = ['cbs', 'df', 'tdm'];
const ONGOING = 'ongoing';
const CHANNEL_DATA_VALUE_KEY = 'data-value';
const AUDIO_CONTROLS_KEY = 'controls';
const AUDIO_EVENT_PLAYING_NAME = 'playing';
const AUDIO_EVENT_PAUSE_NAME = 'pause';
const AUDIO_EVENT_ERROR_NAME = 'error';
const LOADING_DIV_ID = 'loading';
const LOADING_MSG = 'Loading...';
const VJS_PLAY_CONTROL_CLASS = 'vjs-play-control';
const VJS_PLAYING_CLASS = 'vjs-playing';
const LINE_BREAK = '<br>';
const EMPTY_VAL = '';
const ERROR_MSG_TITLE = 'Error: ';
const ERROR_UNKNOWN_MSG = 'Unknown';
const ERROR_REASON_TITLE = 'Reason: ';
const MEDIA_ERR_ABORTED_CODE = 1;
const MEDIA_ERR_NETWORK_CODE = 2;
const MEDIA_ERR_DECODE_CODE = 3;
const MEDIA_ERR_SRC_NOT_SUPPORTED_CODE = 4;
const ERR_ABORTED_MSG = 'ABORTED';
const MEDIA_ERR_NETWORK_CODE_MSG = 'NETWORK';
const MEDIA_ERR_DECODE_CODE_MSG = 'DECODE';
const MEDIA_ERR_SRC_NOT_SUPPORTED_CODE_MSG = 'NOT SUPPORTED';
const TRACK_META_CLASS = 'track-meta';


var currentNowPlayingUrl;
var selectedChannel;
var nowPlayingRequestTimer;
var channelContentUrl;

function playChannel(channelNumber) {
    reset();
    feedHTML(LOADING_DIV_ID, LOADING_MSG);
    var source = document.getElementById(AUDIO_PLAYER_SOURCE_ID);
    var channelElement = document.getElementById(channelsId[channelNumber - 1]);
    source.src = channelElement.getAttribute(CHANNEL_DATA_VALUE_KEY);
    audio.load();
    audio.play();
    currentNowPlayingUrl = NOW_PLAYING_REQUEST_PREFIX + channelElement.innerHTML;
    channelContentUrl = NOW_PLAYING_PICTURE_REQUEST_PREFIX + channelNumber;
    selectedChannel = channelNumber;
    document.getElementById(channelNumber + ONGOING).classList.add(ONGOING);
}

// when the audio player has finished loading and is ready to play
audio.addEventListener(AUDIO_EVENT_PLAYING_NAME, function () {
    feedHTML(LOADING_DIV_ID, EMPTY_VAL);
    audio.controls = AUDIO_CONTROLS_KEY;
    getNowPlaying(currentNowPlayingUrl);
});

// when there is an error
audio.addEventListener(AUDIO_EVENT_ERROR_NAME, function (e) {
    clearTimeout(nowPlayingRequestTimer);
    var errorCode = e.currentTarget.error.code;
    reset();
    manageError(errorCode, EMPTY_VAL);
});

// action performed on pause button click
audio.addEventListener(AUDIO_EVENT_PAUSE_NAME, function (e) {
    audio.currentTime = 0;
    reset();
});

// request now playing from IFM server every NOW_PLAYING_REQUEST_TIMEOUT_MSEC
var previousTrackTitle = EMPTY_VAL;
async function getNowPlaying() {
    if (selectedChannel) { // if playing
        try {
            const response = await fetch(currentNowPlayingUrl);
            const trackMetadata = await response.json();
            if (trackMetadata) {
                var title = trackMetadata.title;
                if (previousTrackTitle != title) {
                    // new track
                    feedNowPlaying(title);
                    removeWebConnectorDependencies();
                    addWebConnectorDependencies();
                    previousTrackTitle = title;
                }
            }
        } catch (error) {
            console.log(error);
            clearTimeout(nowPlayingRequestTimer);
            manageError(error);
        }
        nowPlayingRequestTimer = setTimeout(getNowPlaying, NOW_PLAYING_REQUEST_TIMEOUT_MSEC);
    }
}

// populate the now playing html
function feedNowPlaying(value) {
    if (value) {
        var fields = value.split(META_TAGS_SPLIT_CHAR);
        var main = fields[0];
        var otherInfo = fields.slice(1);
        var otherFieldsProcessed = EMPTY_VAL;
        for (var i = 0; i < otherInfo.length; i++) {
            field = otherInfo[i];
            if (field && field.trim() !== EMPTY_VAL) {
                otherFieldsProcessed += otherInfo[i] + LINE_BREAK;
            }
        }
        feedHTML(NOW_PLAYING_DIV_ID, main);
        feedHTML(NOW_PLAYING_DIV_EXT_ID, otherFieldsProcessed);
        extractCoverFromChannelContent();
    } else {
        feedHTML(NOW_PLAYING_DIV_ID, EMPTY_VAL);
        feedHTML(NOW_PLAYING_DIV_EXT_ID, EMPTY_VAL);
        feedHTML(NOW_PLAYING_COVER_DIV_ID, EMPTY_VAL);
    }
}

function reset() {
    clearTimeout(nowPlayingRequestTimer);
    audio.controls = EMPTY_VAL;
    removeOngoingMarker();
    removeWebConnectorDependencies();
    feedHTML(NOW_PLAYING_DIV_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_DIV_EXT_ID, EMPTY_VAL);
    feedHTML(NOW_PLAYING_COVER_DIV_ID, EMPTY_VAL);
    selectedChannel = EMPTY_VAL;
    previousTrackTitle = EMPTY_VAL;
    removeWebConnectorDependencies();
}

function removeOngoingMarker() {
    if (selectedChannel) {
        document.getElementById(selectedChannel + ONGOING).classList.remove(ONGOING);
    }
}

function manageError(code, message) {
    var errorMessage = ERROR_MSG_TITLE;
    if (code) {
        switch (code) {
            case MEDIA_ERR_ABORTED_CODE:
                errorMessage += ERR_ABORTED_MSG;
                break;
            case MEDIA_ERR_NETWORK_CODE:
                errorMessage += MEDIA_ERR_NETWORK_CODE_MSG;
                break;
            case MEDIA_ERR_DECODE_CODE:
                errorMessage += MEDIA_ERR_DECODE_CODE_MSG;
                break;
            case MEDIA_ERR_SRC_NOT_SUPPORTED_CODE:
                errorMessage += MEDIA_ERR_SRC_NOT_SUPPORTED_CODE_MSG;
                break;
            default:
                errorMessage += ERROR_UNKNOWN_MSG;
        }
    }
    if (errorMessage) {
        errorMessage += message;
    }
    feedHTML(NOW_PLAYING_DIV_ID, errorMessage);
    feedHTML(NOW_PLAYING_DIV_EXT_ID, EMPTY_VAL);
}

async function extractCoverFromChannelContent() {
    var extractedCoverUrl = NOW_PLAYING_PICTURE_DEFAULT;
    var response = await fetch(NOW_PLAYING_PICTURE_REQUEST_PREFIX + selectedChannel);
    var body = await response.text();
    var startOfCoverImgIndex = body.indexOf('<img');
    var endOfCoverImgIndex = body.indexOf('alt=""/>') + 10;
    var extractedCoverHTML = body.substring(startOfCoverImgIndex, endOfCoverImgIndex);
    //console.log(extractedCoverHTML);
    feedHTML(NOW_PLAYING_COVER_DIV_ID, extractedCoverHTML);


}

/* following two functions adds/remove fake classes to the player to keep the web scrobble connector compatibility 
https://github.com/web-scrobbler/web-scrobbler/blob/master/src/connectors/intergalacticfm.ts#L8
*/
function removeWebConnectorDependencies() {
    audio.classList.remove(VJS_PLAY_CONTROL_CLASS);
    audio.classList.remove(VJS_PLAYING_CLASS);
    document.getElementById(TRACK_META_DIV_ID).classList.remove(TRACK_META_CLASS);
}

function addWebConnectorDependencies() {
    audio.classList.add(VJS_PLAY_CONTROL_CLASS);
    audio.classList.add(VJS_PLAYING_CLASS);
    document.getElementById(TRACK_META_DIV_ID).classList.add(TRACK_META_CLASS);
}

function feedHTML(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}
