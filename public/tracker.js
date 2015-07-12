/** @jsx React.DOM */

var COLUMNS = 16;

var SOUNDS = [
    { name: 'Bass Drum', url: '/sounds/bass.ogg', alt: '/sounds/bass.m4a' },
    { name: 'Snare Drum', url: '/sounds/snare.ogg', alt: '/sounds/snare.m4a' },
    { name: 'Closed Hi-hat', url: '/sounds/hat-closed.ogg', alt: '/sounds/hat-closed.m4a' },
    { name: 'Open Hi-hat', url: '/sounds/hat-open.ogg', alt: '/sounds/hat-open.m4a' },
    { name: 'Ride Cymbal', url: '/sounds/ride.ogg', alt: '/sounds/ride.m4a' },
    { name: 'Hi Tom', url: '/sounds/tom2.ogg', alt: '/sounds/tom2.m4a' },
    { name: 'Mid Tom', url: '/sounds/tom3.ogg', alt: '/sounds/tom3.m4a' },
    { name: 'Low Tom', url: '/sounds/tom4.ogg', alt: '/sounds/tom4.m4a' },
    { name: 'Crash 1', url: '/sounds/crash-2.ogg', alt: '/sounds/crash-2.m4a' },
    { name: 'Crash 2', url: '/sounds/crash-1.ogg', alt: '/sounds/crash-1.m4a' },
//    { name: 'Cowbell', url: '/sounds/cowbell.ogg', alt: '/sounds/cowbell.m4a' }
];

function checkId(track, row, col) {
    return track + "_" + row + "_" + col;
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
                    <button className="btn btn-danger button-remove-track" data-name={name}>
                        <span title="Delete" className="glyphicon glyphicon-remove"></span>
                    </button>
                    <span className="track-spacer"></span>
                    <span className="track-label">{this.props.name}</span>
                    <span className="track-spacer"></span>
                    <button className="btn btn-normal button-clear-track" data-name={name}>
                        <span title="Clear" className="glyphicon glyphicon-unchecked"></span>
                    </button>
                    <button className="btn btn-normal button-copy-track" data-name={name}>
                        <span title="Copy" className="glyphicon glyphicon-log-out"></span>
                    </button>
                </div>
                <table className="track-table" id={"track_" + name}>
                    {
                        _.range(SOUNDS.length).map(function(row) {
                            return <tr key={row} data-row={row}><th>{SOUNDS[row].name}</th>
                                {
                                    _.range(COLUMNS).map(function(col) {
                                        var id = checkId(name, row, col);
                                        return <td key={col} data-col={col}>
                                            <input id={id} data-col={col} data-row={row} type="checkbox"/>
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

var g_Tracker;
var Tracker = React.createClass({
    getInitialState: function() {
        g_Tracker = this;

        return {
            tracks: []
        };
    },

    render: function() {
        return (
            <div className="track-list">
                {this.state.tracks}
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

    addTrack: function() {
        var letter = this.newTrackName();
        if (!letter) {
            return;
        }
        this.state.tracks.push(<Track key={letter} name={letter}/>);
        this.setState(this.state);
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

function finishInitialization() {
    $('#loading_message').hide();
    $("#button-add-track").prop("disabled", false);
    var track = g_Tracker.addTrack();
    focusTrack(track);
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

function initKeyboardNavigation() {
    $('[data-toggle="popover"]').popover();
    $(document).keydown(function(event) {
        console.log(event);

        // ** global shortcuts

        // play / pause `
        if (event.keyCode == 192) {
            g_Player.playOrPause();
            return;
        }

        // help ?
        if (event.shiftKey && event.keyCode == 191) {
            $("#button-help").trigger('click');
        }


        // ** location-aware global shortcuts
        var loc = focusedLocation();

        // add track +
        if (event.keyCode == 107 || event.keyCode == 187 || event.keyCode == 61) {
            var track = g_Tracker.addTrack();
            focusTrack(track, loc);
            return;
        }

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

        // delete track -
        if (event.keyCode == 109 || event.keyCode == 189 || event.keyCode == 173) {
            var toFocus = g_Tracker.nextTrack(loc.track, 1);
            g_Tracker.removeTrack(loc.track);
            focusLocation(toFocus, loc.row, loc.col);
            return;
        }

        // previous track [ / next track ]
        if (event.keyCode == 219 || event.keyCode == 221) {
            var newTrack = g_Tracker.nextTrack(loc.track, event.keyCode - 220);
            focusTrack(newTrack, loc);
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
    initKeyboardNavigation();

    g_Player = new Player();
    g_Player.loadSounds();

    $("#input-tempo").change(function(event) {
        g_Player.changeTempo($(this).val());
    });
    $("#input-tempo").trigger('change');

    $("#button-play").click(function(event) {
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

    React.render(<Tracker/>, $('#tracker-container')[0]);
})
