/** @jsx React.DOM */

var COLUMNS = 16;

var SOUNDS = [
    { name: 'Bass Drum', url: '/sounds/bass.ogg' },
    { name: 'Snare Drum', url: '/sounds/snare.ogg' },
    { name: 'Closed Hi-hat', url: '/sounds/hat-closed.ogg' },
    { name: 'Open Hi-hat', url: '/sounds/hat-open.ogg' },
    { name: 'Ride Cymbal', url: '/sounds/ride.ogg' },
    { name: 'Hi Tom', url: '/sounds/tom2.ogg' },
    { name: 'Mid Tom', url: '/sounds/tom3.ogg' },
    { name: 'Low Tom', url: '/sounds/tom4.ogg' },
    { name: 'Crash 1', url: '/sounds/crash-2.ogg' },
    { name: 'Crash 2', url: '/sounds/crash-1.ogg' }
];

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
                    <button className="btn button-clear-track" data-name={name}>
                        <span title="Clear" className="glyphicon glyphicon-unchecked"></span>
                    </button>
                    <button className="btn button-copy-track" data-name={name}>
                        <span title="Copy" className="glyphicon glyphicon-log-out"></span>
                    </button>
                    <div className="track-label">{this.props.name}</div>
                </div>
                <table className="table table-condensed table-striped-column" id={"track_" + name}>
                    {
                        _.range(SOUNDS.length).map(function(row) {
                            return <tr key={row}><th>{SOUNDS[row].name}</th>
                                {
                                    _.range(COLUMNS).map(function(col) {
                                        return <td key={col} data-col={col}><input data-col={col} data-row={row} type="checkbox"/></td>
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
            nextLetter: 'A',
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

    getNextLetter: function() {
        var letter = this.state.nextLetter;
        this.state.nextLetter = String.fromCharCode(this.state.nextLetter.charCodeAt(0) + 1);
        return letter;
    },

    addTrack: function() {
        var letter = this.getNextLetter();
        this.state.tracks.push(<Track key={letter} name={letter}/>);
        this.setState(this.state);
        var sequence = $('#input-track-sequence')
        sequence.val(sequence.val() + letter);
        sequence.trigger('change');
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

    clearTrack: function(name) {
        $("#track_" + name + " input:checked").prop('checked', false);
    },

    copyTrack: function(source) {
        var newName = this.state.nextLetter;
        this.addTrack();
        $("#track_" + source + " input:checked").each(function(index, el) {
            var row = el.getAttribute('data-row');
            var col = el.getAttribute('data-col');
            $('#track_' + newName + ' input[data-row="' + row + '"][data-col="' + col + '"]').prop('checked', true);
        });
    }
});

var Player = function() {
    this.tempo = 0;
    this.sequence = '';
    this.index = 0;
    this.column = 0;
    this.interval = null;
};

Player.prototype.loadSounds = function() {
    this.audio_context = new AudioContext();
    var self = this;
    for(var index in SOUNDS) {
        var url = SOUNDS[index].url;
        var request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";
        request.data_index = index;
        request.onload = function() {
            var index = this.data_index;
            self.audio_context.decodeAudioData(this.response, function(buffer) {
                console.log("loaded " + SOUNDS[index].url + "");
                self.loadedSound(index, buffer);
            }, function(e) {
                console.error("Failed to load audio data for " + SOUNDS[index].url);
            });
        };
        request.send();
    }
}

Player.prototype.loadedSound = function(index, buffer) {
    SOUNDS[index].buffer = buffer;

    // see if all are loaded, then proceed
    if (!_.detect(SOUNDS, function(sound) { return !sound.buffer; })) {
        $('#loading_message').hide();
        $("#button-add-track").prop("disabled", false);
    }
}

Player.prototype.changeTempo = function(tempo) {
    this.tempo = parseInt(tempo);
    if (this.tempo > 255) {
        this.tempo = 255;
    } else if(this.tempo < 15) {
        this.tempo = 15;
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

$(document).ready(function() {
    g_Player = new Player();
    g_Player.loadSounds();

    $("#input-tempo").change(function(event) {
        g_Player.changeTempo($(this).val());
    });
    $("#input-tempo").trigger('change');

    $("#button-play").click(function(event) {
        event.preventDefault();
        g_Player.play();
    });

    $("#button-pause").click(function(event) {
        event.preventDefault();
        g_Player.pause();
    });

    $("#button-stop").click(function(event) {
        event.preventDefault();
        g_Player.stop();
    });

    $("#input-track-sequence").change(function(event) {
        g_Player.changeSequence($(this).val());
    });

    $("#button-add-track").click(function(event) {
        event.preventDefault();
        g_Tracker.addTrack();
    });

    $("#tracker-container").on("click", ".button-remove-track", function(event) {
        g_Tracker.removeTrack($(this).data('name'));
    })

    $("#tracker-container").on("click", ".button-clear-track", function(event) {
        g_Tracker.clearTrack($(this).data('name'));
    })

    $("#tracker-container").on("click", ".button-copy-track", function(event) {
        g_Tracker.copyTrack($(this).data('name'));
    })

    React.render(<Tracker/>, $('#tracker-container')[0]);
})
