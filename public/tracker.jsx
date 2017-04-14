var g_Player;

var COLUMNS = 16;

var SOUNDS = [
    { name: 'Bass Drum', url: '/sounds/bass.ogg', alt: '/sounds/bass.m4a' },
    { name: 'Snare Drum', url: '/sounds/snare.ogg', alt: '/sounds/snare.m4a' },
    { name: 'Closed Hi-hat', url: '/sounds/hat-closed.ogg', alt: '/sounds/hat-closed.m4a' },
    { name: 'Open Hi-hat', url: '/sounds/hat-open.ogg', alt: '/sounds/hat-open.m4a' },
    { name: 'Ride Cymbal', url: '/sounds/ride.ogg', alt: '/sounds/ride.m4a' },
    { name: 'Cowbell', url: '/sounds/cowbell.ogg', alt: '/sounds/cowbell.m4a' },
    { name: 'Hi Tom', url: '/sounds/tom2.ogg', alt: '/sounds/tom2.m4a' },
    { name: 'Mid Tom', url: '/sounds/tom3.ogg', alt: '/sounds/tom3.m4a' },
    { name: 'Low Tom', url: '/sounds/tom4.ogg', alt: '/sounds/tom4.m4a' },
    { name: 'Crash 1', url: '/sounds/crash-2.ogg', alt: '/sounds/crash-2.m4a' },
    { name: 'Crash 2', url: '/sounds/crash-1.ogg', alt: '/sounds/crash-1.m4a' }
];

var current_song;

function setSongName(name) {
    current_song = name;
    document.title = (name ? name : "untitled") + " - Panda Rhythm";
    var $header = $('.small-header');
    if ($header.length) {
        $header.text(document.title);
    }
}

function checkId(track, row, col) {
    return track + "_" + row + "_" + col;
}

function closeButton() {
    return $('<a href="#" class="close" data-dismiss="alert" aria-label="close">&emsp;&times;</a>');
}

function flashError(message) {
    var $alert = $("<div>").attr("class", "alert alert-danger fade in").text(message);
    $alert.append(closeButton());
    $("#alert_container").empty().append($alert);
}

function flashSuccess(message, link, title, download) {
    var $alert = $("<div>").attr("class", "alert alert-success fade in").text(message + " ");
    if (link) {
        var $link = $("<a>").attr("href", link);
        $link.text(title || link);
        if (download) {
            $link.attr("download", download);
        }
        $alert.append($link);
    }
    $alert.append(closeButton());
    $("#alert_container").empty().append($alert);
}

var Track = React.createClass({
    getInitialState: function() {
        return {};
    },

    render: function() {
        var name = this.props.name;
        return (
            <div className="track">
                <div className="track-header">
                    {
                        window.REVIEW ? null : (
                            <button className="btn btn-danger button-remove-track" data-name={name}>
                                <span title="Delete" aria-label="Delete track" className="glyphicon glyphicon-remove"></span>
                            </button>
                        )
                    }
                    <span className="track-spacer"></span>
                    <span className="track-label">{this.props.name}</span>
                    <span className="track-spacer"></span>
                    {
                        window.REVIEW ? null : (
                            <button className="btn btn-normal button-clear-track" data-name={name}>
                                <span title="Clear" aria-label="Clear track" className="glyphicon glyphicon-unchecked"></span>
                            </button>
                        )
                    }
                    {
                        window.REVIEW ? null : (
                            <button className="btn btn-normal button-copy-track" data-name={name}>
                                <span title="Copy" aria-label="Copy track" className="glyphicon glyphicon-log-out"></span>
                            </button>
                        )
                    }
                </div>
                <table className="track-table" id={"track_" + name}>
                    {
                        _.range(SOUNDS.length).map(function(row) {
                            return <tr key={row} data-row={row}><th>{SOUNDS[row].name}</th>
                                {
                                    _.range(COLUMNS).map(function(col) {
                                        var id = checkId(name, row, col);
                                        return <td key={col} data-col={col}>
                                            {
                                                window.REVIEW ?
                                                <input id={id} data-col={col} data-row={row} type="checkbox" aria-disabled="true" className="read-only"/> :
                                                <input id={id} data-col={col} data-row={row} type="checkbox"/>
                                            }
                                            <label htmlFor={id}><span/></label>
                                            </td>
                                    })
                                }
                                </tr>;
                        })
                    }
                </table>
            </div>
        );
    }
});

var OpenDialog = React.createClass({
    getInitialState: function() {
       return { isOpen: false, disabled: true, songs: [] };
    },

    openModal: function() {
        this.setState({isOpen: true});
    },

    afterOpenModal: function() {
        this.refs.songSelect.value = current_song;
        this.refs.songSelect.focus();
        this.songChanged();
    },

    closeModal: function() {
        this.setState({isOpen: false});
    },

    Ok: function() {
        this.closeModal();
        this.props.onSongSelected(this.refs.songSelect.value);
    },

    songChanged: function() {
        var song = this.refs.songSelect.value;
        if (song && song.length > 0) {
            this.setState({disabled: false});
        } else {
            this.setState({disabled: true});
        }
    },

    render: function() {
        return (
            <ReactModal isOpen={this.state.isOpen}
                onAfterOpen={this.afterOpenModal}
                onRequestClose={this.closeModal}
                className="open-modal"
                overlayClassName="open-modal-overlay">
                <div className="form-group">
                    <label htmlFor="song-select">Select song:</label>
                    <select ref="songSelect" className="form-control" id="song-select" onChange={this.songChanged}>
                    {
                        _.map(this.state.songs, function(name) {
                            return <option value={name}>{name}</option>
                        })
                    }
                    </select>
                </div>
                <button type="submit" onClick={this.Ok} className="btn btn-primary" disabled={this.state.disabled}>Open</button>
                &ensp;
                <button onClick={this.closeModal} className="btn btn-default">Cancel</button>
            </ReactModal>
        );
    }
});

var PromptDialog = React.createClass({
    getInitialState: function() {
        return { isOpen: false };
    },

    openModal: function(initial_value, ok_text, ok_callback) {
        this.setState({isOpen: true, value: initial_value, okText: ok_text, onOk: ok_callback});
    },

    afterOpenModal: function() {
        this.refs.textInput.focus();
    },

    closeModal: function() {
        this.setState({isOpen: false});
    },

    handleChange: function(event) {
        this.setState({value: event.target.value, disabled: !event.target.value});
    },

    Ok: function() {
        this.closeModal();
        this.state.onOk(this.state.value);
    },

    render: function() {
        return (
            <ReactModal isOpen={this.state.isOpen}
                onRequestClose={this.closeModal}
                onAfterOpen={this.afterOpenModal}
                className="open-modal"
                overlayClassName="open-modal-overlay">
                <div className="form-group">
                    <label htmlFor="text-input">{this.props.promptText}</label>
                    <input id="text-input" ref="textInput" className="form-control" value={this.state.value} onChange={this.handleChange}/>
                </div>
                <button type="submit" onClick={this.Ok} className="btn btn-primary" disabled={this.state.disabled}>{this.state.okText}</button>
                &ensp;
                <button onClick={this.closeModal} className="btn btn-default">Cancel</button>
            </ReactModal>
        );
    }
});

var g_Tracker;
var Tracker = React.createClass({
    getInitialState: function() {
        g_Tracker = this;

        return {
            tracks: []
        };
    },

    componentDidMount: function() {
        var songs = JSON.parse(localStorage.songs);
        this.refs.openDialog.setState({songs: _.keys(songs)});
    },

    render: function() {
        return (
            <div>
                <div className="track-list">
                    {this.state.tracks}
                </div>
                <OpenDialog ref="openDialog" onSongSelected={this.onSongSelected}/>
                <PromptDialog ref="saveDialog" promptText='Enter song name:'/>
            </div>
        );
    },

    allTrackNames: function() {
        return this.state.tracks.map(function(el) { return el.props.name });
    },

    newTrackName: function() {
        var allNames = this.allTrackNames();
        for(var i = 65; i <= 90; ++i) {
            var name = String.fromCharCode(i);
            if (allNames.indexOf(name) < 0) {
                return name;
            }
        }
        return null;
    },

    nextTrack: function(name, direction) {
        var allNames = this.allTrackNames();
        if (allNames.length == 0) {
            return null;
        }
        var index = allNames.indexOf(name);
        if (index < 0) {
            return allNames[0];
        }
        return allNames[wrapAdd(index, direction, allNames.length)];
    },

    addTrack: function(letter, callback) {
        letter = letter || this.newTrackName();
        if (!letter) {
            return;
        }
        this.state.tracks.push(<Track key={letter} name={letter}/>);
        this.setState(this.state, callback);
        var sequence = $('#input-track-sequence')
        sequence.val(sequence.val() + letter);
        sequence.trigger('change');
        return letter;
    },

    removeTrack: function(name) {
        this.state.tracks = _.reject(this.state.tracks, function(track) {
            return track.props.name == name;
        });
        this.setState(this.state);
        var sequence = $('#input-track-sequence')
        sequence.val(sequence.val().split(name).join(''));
        sequence.trigger('change');
    },

    clearTrack: function(name, startingColumn) {
        if (startingColumn > 0) {
            for(var c = startingColumn; c < COLUMNS; ++c) {
                $('#track_' + name + ' input:checked[data-col="' + c + '"]').prop('checked', false);
            }
        } else {
            $("#track_" + name + " input:checked").prop('checked', false);
        }
    },

    copyTrack: function(source) {
        var newName = this.addTrack();
        $("#track_" + source + " input:checked").each(function(index, el) {
            var row = el.getAttribute('data-row');
            var col = el.getAttribute('data-col');
            $('#' + checkId(newName, row, col)).prop('checked', true);
        });
        return newName;
    },

    clearSong: function() {
        var dfd = $.Deferred();
        this.setState({tracks: []}, function() {
            setSongName("");
            $('#input-track-sequence').val('').trigger('change');
            dfd.resolve();
        });
        return dfd;
    },

    saveSong: function(name) {
        setSongName(name);
        var song = {
            name: name,
            sequence: $('#input-track-sequence').val(),
            tempo: parseInt($("#input-tempo").val()),
            tracks: {}
        }
        _.each(this.state.tracks, function(track) {
            var track_hash = {}
            for(var row in SOUNDS) {
                var cols = "";
                for(var i = 0; i < COLUMNS; ++i) {
                    cols += (document.getElementById(checkId(track.props.name, row, i)).checked ? '*' : ' ');
                }
                track_hash[SOUNDS[row].name] = cols;
            }
            song.tracks[track.props.name] = track_hash;
        });
        // wai u no store objects, localStorage :P
        var songs = JSON.parse(localStorage.songs);
        if (songs.hasOwnProperty(name)) {
            _.extend(songs[name], song);
        } else {
            songs[name] = song;
        }
        localStorage.songs = JSON.stringify(songs);
        this.refs.openDialog.setState({songs: _.keys(songs)});
    },

    loadSong: function(name) {
        var self = this;
        var songs = JSON.parse(localStorage.songs);
        var song;
        if (song = songs[name]) {
            this.clearSong().then(function() {
               self.loadSongData(song);
            });
        } else {
            alert('Song not found :(');
        }
    },

    loadSongData: function(song) {
        var self = this;
        if (!song.tracks) {
            var track = self.addTrack();
            focusTrack(track);
            return;
        }
        setSongName(song.name);
        _.each(song.tracks, function(track, name) {
            self.addTrack(name, function() {
                for(var row in SOUNDS) {
                    var sound = SOUNDS[row].name;
                    if (track[sound]) {
                        for(var i = 0; i < COLUMNS; ++i) {
                            if (track[sound][i] != ' ') {
                                document.getElementById(checkId(name, row, i)).checked = true;
                            }
                        }
                    }
                }
            });
        });

        $('#input-tempo').val(song.tempo).trigger('change');
        $('#input-track-sequence').val(song.sequence).trigger('change');
    },

    onOpen: function() {
        this.refs.openDialog.openModal();
    },

    onSongSelected: function(name) {
        this.loadSong(name);
    },

    onSave: function() {
        this.refs.saveDialog.openModal(current_song, "Save", this.saveSong.bind(this));
    },

    onShare: function() {
        this.refs.saveDialog.openModal(current_song, "Share", this.shareSong.bind(this));
    },

    onSubmit: function() {
        this.refs.saveDialog.openModal(current_song, "Submit Assignment", this.submitSong.bind(this));
    },

    onTemplate: function() {
        this.refs.saveDialog.openModal(current_song, "Save Template", this.templateSong.bind(this));
    },

    shareSong: function(name, opts = {})
    {
        this.saveSong(name);
        var songs = JSON.parse(localStorage.songs);
        var song = songs[name];
        var id, token;
        if (opts.template) {
            id = opts.template.id;
            token = opts.template.token;
        } else {
            id = song.id;
            token = song.token;
        }
        var dfd = $.Deferred();
        if (!opts.forSubmission && id && token) {
            // update existing song
            $.ajax("/songs/" + id, {
                method: 'PUT',
                data: {
                    token: token,
                    data: JSON.stringify(song, function(k, v) {
                        return (k == "id" || k == "token") ? undefined : v;
                    })
                },
                success: function(data) {
                    dfd.resolve(id);
                    if (!opts.template) {
                        var url = BASE_URL + "?song=" + id;
                        flashSuccess("Song updated!", url);
                    }
                },
                error: function(jqXHR) {
                    flashError("Failed to update song: " + jqXHR.statusText);
                    dfd.reject();
                }
            });
        } else {
            // create new song
            $.ajax("/songs", {
                method: 'POST',
                data: {
                    data: JSON.stringify(song)
                },
                success: function(data) {
                    // store id and token for next time
                    dfd.resolve(data.id);

                    if (!opts.forSubmission) {
                        songs[name].id = data.id;
                        songs[name].token = data.token;
                        localStorage.songs = JSON.stringify(songs);

                        var url = BASE_URL + "?song=" + data.id;
                        flashSuccess("Song shared successfully!", url);
                    }
                },
                error: function(jqXHR) {
                    flashError("Failed to share song: " + jqXHR.statusText);
                    dfd.reject();
                }
            });
        }
        return dfd;
    },

    submitSong: function(name)
    {
        this.saveSong(name);
        this.shareSong(name, {forSubmission: true}).then(function(id) {
            $.ajax("/submit", {
               method: 'POST',
               data: {
                 song_id: id,
                 launch_params: LAUNCH_PARAMS
               },
               success: function(data) {
                 flashSuccess('Assignment submitted!');
               },
               error: function(jqXHR) {
                 flashError("Failed to submit song: " + jqXHR.statusText);
               }
            });
        });
    },

    templateSong: function(name)
    {
        this.saveSong(name);
        this.shareSong(name, {template: {id: window.TEMPLATE_ID, token: window.TEMPLATE_TOKEN}}).then(function() {
            flashSuccess("Assignment template saved!");
        });
    }
});

function focusedLocation() {
    var row = 0, col = 0, track = null;
    var focused = document.activeElement;
    if (focused.type == 'checkbox') {
        row = parseInt(focused.getAttribute('data-row') || '0');
        col = parseInt(focused.getAttribute('data-col') || '0');
    }
    var $table = $(focused).closest('table');
    if ($table.length) {
        var match = $table.attr('id').match(/^track_(.)$/);
        if (match.length) {
            track = match[1];
        }
    }
    return { element: focused, row: row, col: col, track: track };
}

function focusLocation(track, row, col) {
    $("#" + checkId(track, row, col)).focus();
}

function focusTrack(track, loc) {
    loc = loc || focusedLocation();
    focusLocation(track, loc.row, loc.col);
}

function loadShareSong() {
    var song_id = null;

    if (window.TEMPLATE_ID) {
        song_id = window.TEMPLATE_ID;
    } else {
        var match = window.location.href.match("song=([0-9a-z]+)");
        if (match) {
            song_id = match[1];
        }
    }

    if (song_id) {
        $.ajax("/songs/" + song_id, {
            success: function(data) {
                g_Tracker.loadSongData(data);
            },
            error: function(jqXHR) {
                flashError("Couldn't load that song: " + jqXHR.statusText);
            }
        });
        return true;
    } else {
        setSongName("");
        return false;
    }
}

function finishInitialization() {
    $('#loading_message').hide();
    $("#button-open").prop("disabled", false);
    $("#button-save").prop("disabled", false);
    $("#button-share").prop("disabled", false);
    $("#button-export").prop("disabled", false);
    $("#button-add-track").prop("disabled", false);
    $("#button-submit").prop("disabled", false);
    $("#button-template").prop("disabled", false);
    if (!loadShareSong()) {
        var track = g_Tracker.addTrack();
        focusTrack(track);
    }
}

function unsupportedBrowser() {
    $('#loading_message').hide();
    $('#unsupported_browser').show();
}

var Player = function() {
    this.tempo = 0;
    this.sequence = '';
    this.index = 0;
    this.column = 0;
    this.interval = null;
    this.altAudioFmt = false;
};

Player.prototype.downloadSound = function(index) {
    var url = this.altAudioFmt ? SOUNDS[index].alt : SOUNDS[index].url;
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    var self = this;
    request.onload = function() {
        self.audio_context.decodeAudioData(this.response, function(buffer) {
            console.log("loaded " + url + "");
            self.decodedSound(index, buffer);
        }, function(e) {
            if (!self.altAudioFmt && index == 0) {
                // fall back to .m4a for those dirty Safari users
                self.altAudioFmt = true;
                self.downloadSound(0);
            } else {
                $("<p>").text("Failed to decode " + url).appendTo($("#loading_message"));
            }
        });
    };
    request.send();
}

Player.prototype.loadSounds = function() {
    if (window.hasOwnProperty('AudioContext')) {
        this.audio_context = new AudioContext();
    } else if (window.hasOwnProperty('webkitAudioContext')) {
        this.audio_context = new webkitAudioContext();
    } else {
        unsupportedBrowser();
    }
    this.downloadSound(0);
}

Player.prototype.decodedSound = function(index, buffer) {
    SOUNDS[index].buffer = buffer;

    // if this is sound 0, we've found a supported audio format. load the remainder
    if (index == 0) {
        for(var i = 1; i < SOUNDS.length; ++i) {
            this.downloadSound(i);
        }
    } else {
        // see if all are loaded, then proceed
        if (!_.detect(SOUNDS, function (sound) { return !sound.buffer; })) {
            finishInitialization();
        }
    }
}

Player.prototype.changeTempo = function(tempo) {
    this.tempo = parseInt(tempo);
    if(this.tempo < 1) {
        this.tempo = 1;
    }
    if (this.interval) {
        this.setInterval();
    }
};

Player.prototype.changeSequence = function(sequence) {
    this.sequence = sequence;
    if (this.index >= this.sequence.length) {
        this.restart();
    }
};

// iOS won't play Web Audio until it is activated as the result of a user action
// so play a sound (silently) when the user clicks play, just to make iOS happy
Player.prototype.enableSoundOnIOS = function() {
    if (!this.unmutedIOS) {
        this.unmutedIOS = true;
        var buffer = SOUNDS[0].buffer;
        var source = this.audio_context.createBufferSource();
        source.buffer = buffer;
        var gainNode = this.audio_context.createGain();
        gainNode.gain.value = 0;
        source.connect(gainNode);
        gainNode.connect(this.audio_context.destination);
        source.start(0);
    }
}

Player.prototype.play = function() {
    if (this.interval) {
        this.restart();
    } else {
        this.setInterval();
    }
};

Player.prototype.playOrPause = function() {
    if (this.interval) {
        this.pause();
    } else {
        this.play();
    }
};

Player.prototype.clearHighlight = function() {
    if (this.lastSelector) {
        $(this.lastSelector).removeClass('play');
    }
};

Player.prototype.highlightColumn = function(track, column) {
    this.clearHighlight();
    var selector = '#track_' + track + ' td[data-col="' + column + '"]'
    $(selector).addClass('play');
    this.lastSelector = selector;
};

Player.prototype.pause = function() {
    this.clearInterval();
};

Player.prototype.stop = function() {
    this.pause();
    this.restart();
    this.clearHighlight();
};

Player.prototype.restart = function() {
    this.index = 0;
    this.column = 0;
};

Player.prototype.setInterval = function() {
    this.clearInterval();
    this.interval = window.setInterval(this.tick.bind(this), 15000 / this.tempo);
};

Player.prototype.clearInterval = function() {
    if (this.interval) {
        window.clearInterval(this.interval);
        this.interval = null;
    }
};

Player.prototype.tick = function() {
    // check whether the track got deleted out from under us
    if (this.sequence.length == 0) {
        this.stop();
        return;
    }
    else if (this.index >= this.sequence.length) {
        this.index = 0;
    }
    //console.log('tick ' + this.index + ", " + this.column);
    this.playColumn(this.sequence[this.index], this.column);
    if (++this.column >= COLUMNS) {
        this.column = 0;
        this.index = (this.index + 1) % this.sequence.length;
    }
};

Player.prototype.playColumn = function(track, column) {
    this.highlightColumn(track, column);
    var els = $('#track_' + track + ' td[data-col="' + column + '"] input:checked');
    var active_sounds = els.map(function(index, el) { return el.getAttribute('data-row'); });
    var self = this;
    active_sounds.each(function(index, sound_index) {
        var buffer = SOUNDS[parseInt(sound_index)].buffer;
        var source = self.audio_context.createBufferSource();
        source.buffer = buffer;
        source.connect(self.audio_context.destination);
        source.start(0);
    });
};

// song length in *samples*, with a few seconds of padding for sounds struck near the end to decay
Player.prototype.songLengthSamples = function() {
    return 88200 + (this.sequence.length * (COLUMNS/4) * 60 * 44100) / this.tempo;
}

Player.prototype.renderAudio = function(context, filename) {
    var timeOffset = 0.0;
    var tickLength = 15.0 / this.tempo;
    for(var i = 0; i < this.sequence.length; ++i) {
        var track_name = this.sequence[i];
        for(var j = 0; j < COLUMNS; ++j) {
            var els = $('#track_' + track_name + ' td[data-col="' + j + '"] input:checked');
            var active_sounds = els.map(function(index, el) { return el.getAttribute('data-row'); });
            active_sounds.each(function(index, sound_index) {
                var buffer = SOUNDS[parseInt(sound_index)].buffer;
                var source = context.createBufferSource();
                source.buffer = buffer;
                source.connect(context.destination);
                source.start(timeOffset);
            });
            timeOffset += tickLength;
        }
    }
    context.oncomplete = this.savWav.bind(this, filename);
    context.startRendering();
}

Player.prototype.savWav = function(filename, ev) {
    // to see if we have a good buffer, just try and play it outright
    /*
    var source = this.audio_context.createBufferSource();
    source.buffer = ev.renderedBuffer;
    source.connect(this.audio_context.destination);
    source.start(0);
    */

    var wav = audioBufferToWav(ev.renderedBuffer);
    var blob = new Blob([new DataView(wav)], { type: 'audio/wav' });
    var url = URL.createObjectURL(blob);
    flashSuccess("Download WAV file: ", url, filename, filename);
}

Player.prototype.exportSong = function(filename) {
    var context;
    if (window.hasOwnProperty('OfflineAudioContext')) {
        context = new OfflineAudioContext(2, this.songLengthSamples(), 44100);
    } else if (window.hasOwnProperty('webkitOfflineAudioContext')) {
        context = new webkitOfflineAudioContext(2, this.songLengthSamples(), 44100);
    } else {
        flashError("OfflineAudioContext isn't a thing.  Try upgrading your browser.");
        return false;
    }
    this.renderAudio(context, filename);

};

function wrapAdd(a, b, max) {
    var c = a + b;
    while (c < 0) {
        c += max;
    }
    while (c >= max) {
        c -= max;
    }
    return c;
}

function initLocalStorage() {
    if (localStorage.songs === undefined) {
        localStorage.songs = "{}"
    }
}

function initKeyboardNavigation() {
    $('[data-toggle="popover"]').popover();
    $(document).keydown(function(event) {
        //console.log(event);

        // ** global shortcuts
        if (!window.REVIEW) {
            // open
            if (event.keyCode == 79 && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                g_Tracker.onOpen();
                return;
            }

            // save
            if (event.keyCode == 83 && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                g_Tracker.onSave();
                return;
            }
        }

        // play / pause `
        if (event.keyCode == 192) {
            g_Player.playOrPause();
            return;
        }

        // help ?
        if (event.shiftKey && event.keyCode == 191) {
            $("#button-help").trigger('click');
            return;
        }


        // ** location-aware global shortcuts
        var loc = focusedLocation();

         if (!loc.track) {
            // [ or ] when not in a track will select the last or first track
            if (event.keyCode == 219 || event.keyCode == 221) {
                var allTracks = g_Tracker.allTrackNames();
                focusTrack(event.keyCode == 40 ? allTracks[0] : allTracks[allTracks.length - 1]);
            }
            // everything beyond this requires a location
            return;
        }

        // ** local shortcuts

        // previous track [ / next track ]
        if (event.keyCode == 219 || event.keyCode == 221) {
            var newTrack = g_Tracker.nextTrack(loc.track, event.keyCode - 220);
            focusTrack(newTrack, loc);
            return;
        }

        if (!window.REVIEW) {
            // delete track -
            if (event.keyCode == 109 || event.keyCode == 189 || event.keyCode == 173) {
                var toFocus = g_Tracker.nextTrack(loc.track, 1);
                g_Tracker.removeTrack(loc.track);
                focusLocation(toFocus, loc.row, loc.col);
                return;
            }

            // add track +
            if (event.keyCode == 107 || event.keyCode == 187 || event.keyCode == 61) {
                var track = g_Tracker.addTrack();
                focusTrack(track, loc);
                return;
            }

            // copy track \
            if (event.keyCode == 220) {
                focusTrack(g_Tracker.copyTrack(loc.track), loc);
                return;
            }

            // clear track ;
            if (event.keyCode == 186 || event.keyCode == 59) {
                g_Tracker.clearTrack(loc.track, event.shiftKey ? loc.col : 0);
                return;
            }

            if (event.keyCode >= 48 /* 0 */ && event.keyCode <= 57 /* 9 */ ||
                event.keyCode >= 96 /* 0 */ && event.keyCode <= 105 /* 9 */) {
                var number = event.keyCode - ((event.keyCode >= 96) ? 96 : 48);
                if (event.shiftKey) {
                    focusLocation(loc.track, number, loc.col);
                } else {
                    $('#track_' + loc.track + ' tr[data-row="' + loc.row + '"] input').prop("checked", false);
                    if (number != 0) {
                        $('#track_' + loc.track + ' tr[data-row="' + loc.row + '"] td:nth-of-type(' + number + 'n+1) input').prop("checked", true);
                    }
                }
                return;
            }

            if (event.keyCode == 188 /* , */ || event.keyCode == 190 /* . */) {
                // select / deselect one element and move to the next
                loc.element.checked = (event.keyCode == 188);
                var newRow, newCol;
                if (event.shiftKey) {
                    newCol = (loc.row == SOUNDS.length - 1) ? wrapAdd(loc.col, 1, COLUMNS) : loc.col;
                    newRow = (loc.row < SOUNDS.length - 1) ? loc.row + 1 : 0;
                } else {
                    newCol = (loc.col < COLUMNS - 1) ? loc.col + 1 : 0;
                    newRow = (loc.col == COLUMNS - 1) ? wrapAdd(loc.row, 1, SOUNDS.length) : loc.row;
                }
                focusLocation(loc.track, newRow, newCol);
                return;
            }
        }

        // navigation
        if (event.keyCode >= 37 && event.keyCode <= 40) {
            var dr = 0, dc = 0;
            switch(event.keyCode) {
            case 37: // left
                dc = -1;
                break;
            case 38: // up
                dr = -1;
                break;
            case 39: // right
                dc = 1;
                break;
            case 40: // down
                dr = 1;
                break;
            }
            if (dr != 0 || dc != 0) {
                if (event.shiftKey) {
                    dc *= 4;
                }
                var row = wrapAdd(loc.row, dr, SOUNDS.length);
                var col = wrapAdd(loc.col, dc, COLUMNS);
                focusLocation(loc.track, row, col);
             }
        }
    });

}

$(document).ready(function() {
    ReactModal.setAppElement('#tracker-container');
    initKeyboardNavigation();
    initLocalStorage();
    g_Player = new Player();
    g_Player.loadSounds();

    $("#input-tempo").change(function(event) {
        g_Player.changeTempo($(this).val());
    });
    $("#input-tempo").trigger('change');

    $("#button-play").click(function(event) {
        g_Player.enableSoundOnIOS();
        g_Player.play();
    });

    $("#button-pause").click(function(event) {
        g_Player.pause();
    });

    $("#button-stop").click(function(event) {
        g_Player.stop();
    });

    $("#input-track-sequence").change(function(event) {
        g_Player.changeSequence($(this).val());
    });

    $("#button-add-track").click(function(event) {
        g_Tracker.addTrack();
    });

    $("#button-save").click(function(event) {
        g_Tracker.onSave();
    });

    $("#button-share").click(function(event) {
        g_Tracker.onShare();
    });

    $("#button-submit").click(function(event) {
        g_Tracker.onSubmit();
    });

    $("#button-template").click(function(event) {
        g_Tracker.onTemplate();
    });

    $("#button-export").click(function(event) {
        var filename = current_song ? current_song + ".wav" : "Panda Rhythm.wav";
        g_Player.exportSong(filename);
    });

    $("#button-open").click(function(event) {
        g_Tracker.onOpen();
    });

    $("#button-clear").click(function(event) {
        g_Tracker.clearSong();
        var track = g_Tracker.addTrack();
        focusTrack(track);
    });

    $('#tracker-container').on("click", "input.read-only", function (event) {
        event.preventDefault();
    });

    $("#tracker-container").on("click", ".button-remove-track", function(event) {
        g_Tracker.removeTrack($(this).data('name'));
    });

    $("#tracker-container").on("click", ".button-clear-track", function(event) {
        g_Tracker.clearTrack($(this).data('name'));
    });

    $("#tracker-container").on("click", ".button-copy-track", function(event) {
        g_Tracker.copyTrack($(this).data('name'));
    });

    $("#tracker-container").on("change", "table input[type=checkbox]", function(event) {
        this.focus();
    });

    ReactDOM.render(<Tracker/>, $('#tracker-container')[0]);
})
