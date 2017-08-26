/**
 * Created by yuto-note on 2017/07/21.
 */
function Sounder(filesObj) {
    this.soundFilesObj = {
        unload: [],
        loaded: []
    };
    this.firstLoad = false;
    this.sources = [];
    this.loops = [];
    this.nodeGains = {};

    var AudioContext = window.AudioContext // Default
        || window.webkitAudioContext // Safari and old versions of Chrome
        || false;
    this.context = new AudioContext();
}
Sounder.prototype.addFile = function (file, tag) {
    var that = this
    this.soundFilesObj.unload.push({
        filename: file,
        tag: [tag],
        addTag:function(tag){
            this.tag.push(tag);
            return this;
        },
        setVolume:function(volume){
            that.setVolume(this.tag[0],volume);
        }
    });
    return this.soundFilesObj.unload[this.soundFilesObj.unload.length-1];
}

Sounder.prototype.setVolume = function(tag,volume){
    var that = this;

    if(!(tag in that.nodeGains)){
        that.nodeGains[tag] = that.context.createGain()
    }
    that.nodeGains[tag].gain.value = volume;
}

Sounder.prototype.loadFile = function (callback) {

    this.compressor = this.context.createDynamicsCompressor();

    this.compressor.threshold.value = -50;
    this.compressor.knee.value = 40;
    this.compressor.ratio.value = 12;
    this.compressor.reduction.value = -20;
    this.compressor.attack.value = 0;
    this.compressor.release.value = 0.25;

    var context = this.context;
    var soundFilesObj = this.soundFilesObj;
    var that = this;
    Promise.all(soundFilesObj.unload.map(function (file) {
        return new Promise(function (fulfilled, rejected) {
            var request = new XMLHttpRequest();
            request.open("GET", file.filename, true);
            request.responseType = "arraybuffer";

            request.onload = function () {
                context.decodeAudioData(request.response, function (buffer) {
                    soundFilesObj.loaded.push({
                        filename: file.filename,
                        buffer: buffer,
                        tag: file.tag
                    });
                    fulfilled();
                }, function (e) {
                    console.log(e);
                })
            }
            request.send();
        })
    })).then(function () {
        that.firstLoad = true;
        soundFilesObj.unload = [];
        callback && callback();
    })
}

Sounder.prototype.playSound = function (tag, loop, callback, loopstart, loopend) {
    if (loop === undefined) {
        loop = false;
    }
    if (!this.firstLoad) {
        console.log("loadFile ga zikkou sarete naiyo")
    }
    var arr = this.soundFilesObj.loaded.filter(function (f) {
        return f.tag.indexOf(tag)!=-1;
    })
    if (arr.length==0) {
        return false;
    }
    var that = this;
    arr.forEach(function (f) {
        var source = that.context.createBufferSource();
        source.buffer = f.buffer;
        source.loop = loop;
        if (loop) {
            source.loopStart = loopstart || 0;
            source.loopEnd = loopend || f.buffer.duration;
            that.loops.push({tag: f.tag, source: source})
        } else {

            setTimeout(callback, f.buffer.duration * 1000);
        }
        var base = source;
        f.tag.forEach(function(tag){
            if(tag in that.nodeGains){
                base.connect(that.nodeGains[tag]);
            }else{
                that.nodeGains[tag] = that.context.createGain()
                base.connect(that.nodeGains[tag]);
            }
            base = that.nodeGains[tag];
        })

        base.connect(that.compressor);

        that.compressor.connect(that.context.destination);
        source.start()
    });

    return true;
}



Sounder.prototype.stopSound = function (tag) {

    var choiceArray = [];
    this.loops.forEach(function (f,i) {
        if(f.tag.indexOf(tag)!=-1){
            choiceArray.push(i)
        }
    })
    if (choiceArray.length==0) {
        return false;
    }
    var that = this;
    choiceArray.forEach(function(f){
        try {
            that.loops[f].source.stop();
        }catch(e){
            return false;
        }
    })

    this.loops = this.loops.filter(function(f,i){
        return choiceArray.indexOf(i)==-1
    });

    return true;
}