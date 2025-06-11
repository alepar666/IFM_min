/*!
 *  Howler.js Radio Demo
 *  howlerjs.com
 *
 *  (c) 2013-2020, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */

// Cache references to DOM elements.
var elms = ['station0', 'title0', 'live0', 'station1', 'title1', 'live1', 'station2', 'title2', 'live2'];
var currentNowPlayingUrl;
var nowPlayingRequestTimer;
var selectedChannel;
const NOW_PLAYING_REQUEST_TIMEOUT_MSEC = 5000;
const NOW_PLAYING_REQUEST_PREFIX = 'https://www.intergalactic.fm/now-playing?channel=';
const NOW_PLAYING_PICTURE_REQUEST_PREFIX = 'https://www.intergalactic.fm/channel-content/';
const NOW_PLAYING_PICTURE_DEFAULT = 'https://www.intergalactic.fm/sites/default/files/covers/blanco.png';
const NOW_PLAYING_DIV_ID = 'nowPlaying';
const TRACK_META_DIV_ID = 'track-meta';
const NOW_PLAYING_DIV_EXT_ID = 'nowPlayingExt';
const NOW_PLAYING_COVER_DIV_ID = 'nowPlayingCover';
const EMPTY_VAL = '';
const stationsTitles = ['Cybernetic Broadcasting System', 'Disco Fetish', 'The Dream Machine'];
const META_TAGS_SPLIT_CHAR = '|';
const LINE_BREAK = '<br>';
const VJS_PLAY_CONTROL_CLASS = 'vjs-play-control';
const VJS_PLAYING_CLASS = 'vjs-playing';

elms.forEach(function (elm) {
    window[elm] = document.getElementById(elm);
});

/**
 * Radio class containing the state of our stations.
 * Includes all methods for playing, stopping, etc.
 * @param {Array} stations Array of objects with station details ({title, src, howl, ...}).
 */
var Radio = function (stations) {
    var self = this;

    self.stations = stations;
    self.index = 0;

    // Setup the display for each station.
    for (var i = 0; i < self.stations.length; i++) {
        window['title' + i].innerHTML = '<b>' + self.stations[i].title;
        window['station' + i].addEventListener('click', function (index) {
            var isNotPlaying = (self.stations[index].howl && !self.stations[index].howl.playing());

            // Stop other sounds or the current one.
            radio.stop();

            // If the station isn't already playing or it doesn't exist, play it.
            if (isNotPlaying || !self.stations[index].howl) {
                radio.play(index);
            }
        }.bind(self, i));
    }
};
Radio.prototype = {
    /**
     * Play a station with a specific index.
     * @param  {Number} index Index in the array of stations.
     */
    play: function (index) {
        var self = this;
        var sound;

        index = typeof index === 'number' ? index : self.index;
        var data = self.stations[index];

        // If we already loaded this track, use the current one.
        // Otherwise, setup and load a new Howl.
        if (data.howl) {
            sound = data.howl;
        } else {
            sound = data.howl = new Howl({
                src: data.src,
                html5: true, // A live stream can only be played through HTML5 Audio.
                format: ['mp3', 'aac']
            });
        }

        // Begin playing the sound.
        sound.play();

        // Toggle the display.
        self.toggleStationDisplay(index, true);

        // Keep track of the index we are currently playing.
        self.index = index;
        selectedChannel = index + 1;
        currentNowPlayingUrl = NOW_PLAYING_REQUEST_PREFIX + stationsTitles[self.index];
        getNowPlaying();
    },

    /**
     * Stop a station's live stream.
     */
    stop: function () {
        var self = this;

        // Get the Howl we want to manipulate.
        var sound = self.stations[self.index].howl;

        // Toggle the display.
        self.toggleStationDisplay(self.index, false);

        // Stop the sound.
        if (sound) {
            sound.unload();
        }
        feedHTML(NOW_PLAYING_DIV_ID, EMPTY_VAL);
        feedHTML(NOW_PLAYING_DIV_EXT_ID, EMPTY_VAL);
        feedHTML(NOW_PLAYING_COVER_DIV_ID, EMPTY_VAL);
        clearTimeout(nowPlayingRequestTimer);
        selectedChannel = EMPTY_VAL;
        previousTrackTitle = EMPTY_VAL;
        removeWebConnectorDependencies();
    },

    /**
     * Toggle the display of a station to off/on.
     * @param  {Number} index Index of the station to toggle.
     * @param  {Boolean} state true is on and false is off.
     */
    toggleStationDisplay: function (index, state) {
        var self = this;
        // Show/hide the "live" marker.
        window['live' + index].style.opacity = state ? 1 : 0;
    }
};

// Setup our new radio and pass in the stations.
var radio = new Radio([
    {
        title: "Cybernetic Broadcasting System",
        src: 'https://radio.intergalactic.fm/1',
        howl: null
  },
    {
        title: "Disco Fetish",
        src: 'https://radio.intergalactic.fm/2',
        howl: null
  },
    {
        title: "The Dream Machine",
        src: 'https://radio.intergalactic.fm/3',
        howl: null
  }
]);

// request now playing from IFM server every NOW_PLAYING_REQUEST_TIMEOUT_MSEC
var previousTrackTitle = EMPTY_VAL;
async function getNowPlaying() {
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
        //manageError(error);
    }
    nowPlayingRequestTimer = setTimeout(getNowPlaying, NOW_PLAYING_REQUEST_TIMEOUT_MSEC);
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
    document.getElementById(TRACK_META_DIV_ID).classList.remove(VJS_PLAY_CONTROL_CLASS);
    document.getElementById(TRACK_META_DIV_ID).classList.remove(VJS_PLAYING_CLASS);
}

function addWebConnectorDependencies() {
    document.getElementById(TRACK_META_DIV_ID).classList.add(VJS_PLAY_CONTROL_CLASS);
    document.getElementById(TRACK_META_DIV_ID).classList.add(VJS_PLAYING_CLASS);
}

function feedHTML(elementId, value) {
    document.getElementById(elementId).innerHTML = value;
}
