function SlotModuleMk2() {
    var width = paneldata.width;
    var height = paneldata.height;
    this.LOTMODE = {};
    ["NORMAL", "BIG", "JAC"].forEach(function (d, i) {
        this.LOTMODE[d] = i
    }, this)

    // ステージを作る
    var stage = new PIXI.Stage(0xffffff);
    this.events = {};
    var backflash;
    // レンダラーを作る
    var renderer = PIXI.autoDetectRenderer(width, height,{
        backgroundColor : paneldata.reel.background
    });
    // レンダラーのviewをDOMに追加する
    console.log(paneldata)
    document.getElementById("pixiview").appendChild(renderer.view);

    var stopButtonSmart = function (e) {
        var rect = e.target.getBoundingClientRect();
        pushScreen({
            x: e.changedTouches[0].clientX - rect.left,
            y: e.changedTouches[0].clientY - rect.top
        })
    }
    var stopButtonPC = function (e) {
        pushScreen({
            x: e.clientX - e.target.getBoundingClientRect().left,
            y: e.clientY - e.target.getBoundingClientRect().top
        })
    }

    function pushScreen(pos) {
        switch (playControlData.playingStatus) {
            case 'started':
                slotmodule.stopReel(Math.floor(pos.x / (width / 3)))
                break;
            default:
                allkeyListener.press();
        }
    }

    $('canvas')[0].addEventListener('touchstart', stopButtonSmart)
    $('canvas')[0].addEventListener('mousedown', stopButtonPC)

    var leftkeyListener = keyboard(keyconfig.left);
    var centerkeyListener = keyboard(keyconfig.center);
    var rightkeyListener = keyboard(keyconfig.right);
    var betkeyListener = keyboard(keyconfig.bet);
    var leverkeyListener = keyboard(keyconfig.lever);
    var allkeyListener = keyboard(keyconfig.all);

    leftkeyListener.press = function () {
        slotmodule.stopReel(0)
    }
    centerkeyListener.press = function () {
        slotmodule.stopReel(1);
    }
    rightkeyListener.press = function () {
        slotmodule.stopReel(2);
    }
    allkeyListener.press = function () {
        for (var i = 0; i < 3; i++) {
            if (slotmodule.stopReel(i)) {
                return;
            }
        }
        if (playControlData.playingStatus != "beted") {
            slotmodule.betCoin(3);
            return;
        }
        if (playControlData.playingStatus == "beted") {
            slotmodule.leverON()
            return;
        }
    }
    leverkeyListener.press = function () {
        slotmodule.leverON()
    }
    betkeyListener.press = function () {
        slotmodule.betCoin(3)
    }


    this.almighty = allkeyListener.press

    var spilitas = [];
    var reelChips = []; //リールチップ単体のオブジェクトを入れる配列
    var reelChipData = {blank: paneldata.reel.blank}; //リールチップ共通の情報を記憶
    PIXI.loader.add("reelchip", "img/reelchip.json")
        .load(function (loader, resources) {
            var SpriteKeys = [];
            Object.keys(resources.reelchip.textures).forEach(function (key, i) {
                // spilita.push(PIXI.Sprite.fromFrame(key))
                SpriteKeys.push(key)
                if (i == 0) {
                    reelChipData.width = resources.reelchip.textures[key].width;
                    reelChipData.height = resources.reelchip.textures[key].height;
                }
            })
            for (var reel = 0; reel < 3; reel++) {
                reelChips.push([]);
                for (var i = 0; i < reelControl.controlData.reelLength; i++) {
                    var obj = stage.addChild(PIXI.Sprite.fromFrame(SpriteKeys[reelControl.controlData.reelArray[reel][i]]))
                    obj.position.x = (reelChipData.width + reelChipData.blank) * reel;
                    obj.position.y = (reelChipData.height) * i;
                    reelChips[reel].push(obj)
                }
            }
            slotmodule.emit("resourceLoaded")
            slotmodule.initFlash()
        })
    // アニメーション関数を定義する
    var playControlData = {
        reelStatus: [
            "stop",
            "stop",
            "stop"
        ],
        reelSlipLength: [0, 0, 0],
        controlCode: 0,
        maxbet:3,
        playingStatus: "betwait",
        betcoin: 3,
        lotmode: this.LOTMODE.NORMAL,
        flashReservation: [],
        wait: 0,
        oldtime: new Date()
    }
    frame = 0
    function animate() {
        requestAnimationFrame(animate); // 次の描画タイミングでanimateを呼び出す
        //ここにかく
        reelChips.forEach(function (reelarray, i) {
            switch (playControlData.reelStatus[i]) {
                case 'move':
                    reelMove(i, control.reel.speed);
                    break;
                case 'sliping':
                    reelSlip(i, control.reel.slipspeed)
                    break;
            }
        })
        slotmodule.drawFlash()
        slotmodule.UpdatePlayingStatus();
        // フレーム数をインクリメント
        frame++;

        // フレーム数が２で割り切れなければ描画しない

        renderer.render(stage); // 描画する
    }

    this.leverON = function () {
        if (playControlData.playingStatus != "beted") {
            return false;
        }
        playControlData.controlCode = slotmodule.emit("lot")[0];
        if(typeof playControlData.controlCode === "string"){
            playControlData.controlCode = control.code.indexOf(playControlData.controlCode)
        }
        slotmodule.emit("leveron")
        playControlData.playingStatus = 'wait';
        return true;
    }

    var oldyaku;


    this.UpdatePlayingStatus = function () {
        if (playControlData.wait > 0) {
            var deltaTime = new Date() - playControlData.oldtime;
            playControlData.wait -= deltaTime;
            if (playControlData.wait < 0)
                playControlData.wait = 0;
            playControlData.oldtime = new Date()
        }
        switch (playControlData.playingStatus) {
            case 'betwait':
                break;
            case 'beted':
                break;
            case 'leveron':
                break;
            case 'wait':
                if (playControlData.wait == 0) {
                    playControlData.reelStatus.fill('move')
                    playControlData.playingStatus = "started"
                    playControlData.wait = control.wait;
                    this.emit("reelstart");
                }
                break;
            case 'started':
                break;
            case 'reelstop':
                if (getMoveingCount() == 0) {
                    playControlData.playingStatus = "allreelstop"
                } else {
                    playControlData.playingStatus = "started";
                }
                break;
            case 'allreelstop':
                playControlData.playingStatus = "allreelstopwait";
                oldyaku = this.getHitYakus();
                oldyaku.stopend = function(){
                    playControlData.playingStatus = "pay";
                }
                this.emit("allreelstop",oldyaku);
                break;
            case "allreelstopwait":
                break;
            case "pay":
                playControlData.playingStatus = "paying";
                this.emit("pay",{
                    hityaku:oldyaku,
                    payend:function () {
                        playControlData.playingStatus = "betwait";
                        slotmodule.emit("payend")
                        playControlData.betcoin = 0
                    },
                    replay:function(){
                        playControlData.playingStatus = "beted"
                    }
                })
                break;
            case 'paying':
                break;
        }
    }

    function reelMove(reel, speed) {
        reelChips[reel].forEach(function (chip) {
            chip.position.y += speed;
            if (chip.position.y > paneldata.reel.height) {
                chip.position.y = chip.position.y - reelChipData.height * reelControl.controlData.reelLength
            }
            if ((chip.position.y < -reelChipData.height * reelControl.controlData.reelLength ) && speed < 0) {
                chip.position.y = reelChipData.height
            }
        })
    }

    this.betCoin = function (coin) {
        if (playControlData.playingStatus != "betwait") {
            if (playControlData.playingStatus != "beted" || playControlData.betcoin == playControlData.maxbet) {
                return false;
            }
        }
        playControlData.betcoin = playControlData.betcoin + coin;
        if (playControlData.betcoin > playControlData.maxbet) {
            coin += playControlData.maxbet - playControlData.betcoin
            playControlData.betcoin = playControlData.maxbet
        }
        if (playControlData.betcoin >= control.minbet) {
            playControlData.playingStatus = "beting"
            slotmodule.emit("bet", {coin: coin,betend:function(){
                playControlData.playingStatus = "beted"
            }})
        }
    }

    function getMoveingCount() {
        return playControlData.reelStatus.filter(function (stat) {
            return stat == "move"
        }).length
    }

    this.setPlayControlData = function(data){
        this.playControlData = data;
    }

    this.getReelChips = function () {
        return reelChips
    }
    function reelSlip(reel, speed) {
        if (playControlData.reelStatus[reel] == "sliping") {
            if (playControlData.reelSlipLength[reel] > speed) {
                reelMove(reel, speed);
                playControlData.reelSlipLength[reel] -= speed;
            } else {
                reelMove(reel, playControlData.reelSlipLength[reel]);
                playControlData.reelStatus[reel] = "stop"
                playControlData.reelSlipLength[reel] = 0;
                if (getMoveingCount() == 0) {
                    playControlData.playingStatus = "reelstop"
                }
            }
        }
    }

    // 次のアニメーションフレームでanimate()を呼び出してもらう
    requestAnimationFrame(animate);
    this.stopReel = function (reel) {
        if (playControlData.reelStatus[reel] != 'move' || playControlData.reelStatus.some(function (d) {
                return d == "sliping"
            })) {
            return false;
        }
        var slip = this.getReelPos(reel) - getReelSlip(reel, this.getReelPos(reel));
        if (slip < 0)
            slip = reelChips[reel].length + slip
        this.reelSlipStart(reel, slip);
        this.emit("reelstop",{
            count:getMoveingCount(),
            reel:reel
        });
        playControlData.reelStatus[reel] = "sliping";
        return true;
    }

    this.getPlayControlData = function () {
        return playControlData
    }

    function getReelSlip(reel, pos) {
        switch (getMoveingCount()) {
            case 3:
                return reelControl.getStopPos1st(playControlData.controlCode, reel, pos)
                break;
            case 2:
                return reelControl.getStopPos2nd(reel, pos)
                break;
            case 1:
                return reelControl.getStopPos3rd(reel, pos)
                break;
        }
    }

    this.getReelPos = function (reel) {
        return reelChips[reel].findIndex(function (chip) {
            return chip.position.y <= 0 && -chip.position.y < reelChipData.height
        })
    }

    this.getReelPosStrict = function (reel) {
        var reelpos = this.getReelPos(reel);
        return {
            pos: reelpos,
            gap: reelChips[reel][reelpos].position.y
        }
    }

    this.reelSlipStart = function (reel, slips) {
        playControlData.reelSlipLength[reel] = -this.getReelPosStrict(reel).gap + reelChipData.height * slips;
        if (playControlData.reelSlipLength[reel] < 0) {
            console.log("闇が深いコード");
            playControlData.reelSlipLength[reel] += reelChipData.height * slips;
        }
    }

    this.getReelChar = function (reel, pos) {
        return reelControl.controlData.reelArray[reel][pos]
    }

    this.getHitYakus = function () {
        var lines = [];
        var hitcount = 0;
        var pay = 0;
        var hityaku = [];
        for (i = 0; i < reelControl.controlData.maxLine; i++) {
            lines[i] = [];
            var matrix = new Array(3);
            for(var m=0;m<3;m++){
                matrix[m] = [];
                for(var g=0;g<3;g++){
                    matrix[m][g] = 0;
                }
            }
            if (reelControl.controlData.betLine[i][3] > playControlData.betcoin) {
                continue;
            }

            var line_char = [];
            for (j = 0; j < 3; j++) {
                matrix[reelControl.controlData.betLine[i][j]][j] = 1
                line_char.push(this.getReelChar(j, (this.getReelPos(j) + reelControl.controlData.betLine[i][j]) % reelControl.controlData.reelLength))
            }
            reelControl.controlData.yakuList.forEach(function (d, j) {
                var yakuarray = new Array(3).fill(0);
                yakuarray[2] = d & 0xF;
                d = d >> 4;
                var yakumode = d & 0xF;
                d = d >> 4;
                yakuarray[0] = d & 0xF;
                d = d >> 4;
                yakuarray[1] = d & 0xF;
                d = d >> 4;
                if (yakuarray.every(function (d, i) {
                        return (line_char[i] == d || d == 0xF) && (yakumode & (1 << playControlData.lotmode)) != 0
                    })) {
                    lines[i].push(YakuData[j + 1])//YakuDataの0ははずれ
                    hityaku.push(YakuData[j + 1]);
                    hityaku[hityaku.length - 1].line = i;
                    hityaku[hityaku.length - 1].matrix = matrix
                    hitcount++;
                    pay += YakuData[j + 1].pay[playControlData.lotmode]
                }

            })
            if (lines[i].length == 0) {
                lines[i].push(YakuData[0])
            }
        }

        if(pay>control.maxpay[playControlData.betcoin-1]){
            pay = control.maxpay[playControlData.betcoin-1]
        }

        return {
            lines: lines,
            hits: hitcount,
            pay: pay,
            hityaku: hityaku
        }
    }

    this.on = function (key, callback) {
        if (!(key in this.events)) {
            this.events[key] = [];
        }
        this.events[key].push({
            once: false,
            event: callback
        });
    }
    this.once = function (key, callback) {
        if (!(key in this.events)) {
            this.events[key] = [];
        }
        this.events[key].push({
            once: true,
            event: callback
        });
    }
    this.emit = function (key, param) {
        var emitter = [];
        if (param === undefined) {
            param = {};
        }
        param.playControlData = this.getPlayControlData();
        if (key in this.events) {
            this.events[key].forEach(function (call, i) {
                emitter.push(call.event(param));
                if (call.once) {
                    delete this[i]
                }
            }, this.events[key])
        }
        return emitter
    }

    this.initFlash = function () {
        backflash = new PIXI.Graphics();
        stage.addChildAt(backflash, 0)
        this.setFlash(flashdata.default,1)
    }

    this.drawFlash = function () {
        if (playControlData.flashReservation.length == 0) {
            return;
        }
        backflash.clear();
        for (var y = 0; y < 3; y++) {
            for (x = 0; x < 3; x++) {
                var charindex = this.getReelPos(x)
                var flash = playControlData.flashReservation[0].flash;
                backflash.beginFill(flash.back[y][x].color, flash.back[y][x].alpha);
                var xsize = reelChipData.width + reelChipData.blank;
                var ysize = reelChipData.height
                backflash.drawRect(xsize * x, ysize * y, xsize, ysize);
                if (y == 0) {
                    if (reelChips[x][charindex].tint == 0xFFFFFF) {
                        reelChips[x][(charindex + 4) % reelControl.controlData.reelLength].tint = 0xFFFFFF;

                    }
                }
                reelChips[x][(charindex+y)%reelControl.controlData.reelLength].tint = flash.front[y][x].color;
            }
        }
        playControlData.flashReservation[0].timer--;
        if (playControlData.flashReservation[0].timer < 0) {
            playControlData.flashReservation[0].callback&&playControlData.flashReservation[0].callback();
            playControlData.flashReservation.shift();
            for (var reel = 0; reel < 3; reel++) {
                for (var p = 0; p < reelChips[reel].length; p++) {
                    reelChips[reel][p].tint = 0xFFFFFF
                }
            }
        }

    }
    this.setFlash = function (flash, timer, callback) {
        flash || (flash = paneldata.reel.defaultFrash);
        playControlData.flashReservation.push({
            flash: flash,
            timer: timer,
            callback: callback
        })
    }
    this.clearFlashReservation = function () {
        playControlData.flashReservation = [];
        this.setFlash(flashdata.default,1)

    }

    this.setLotMode = function(e){
        playControlData.lotmode = e;
    }

    this.setMaxbet = function(e){
        playControlData.maxbet = e
    }
}
