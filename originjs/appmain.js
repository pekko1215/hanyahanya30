var reelControl = null;

var xhr = new XMLHttpRequest();
xhr.open('GET', 'data/Sample.dat');
xhr.responseType = 'arraybuffer';
controlData = {};
xhr.onload = function () {
    var uUint8array = new Uint8Array(this.response)
    var data_view = new DataView(uUint8array.buffer);
    var pos = 0;
    if (data_view.getUint32(pos, false) != 0x52435432) {
        alert("制御データの読み込みに失敗しました");
        return;
    }
    pos += 4;
    controlData.controlCount = data_view.getUint8(pos++, false)
    controlData.reelChipCount = data_view.getUint8(pos++, false);
    controlData.reelLength = data_view.getUint8(pos++, false);
    controlData.yakuCount = data_view.getUint8(pos++, false);
    controlData.maxLine = data_view.getUint8(pos++, false);
    controlData.reelArray = [
        [],
        [],
        []
    ]
    controlData.reelArray = controlData.reelArray.map(function () {
        var array = [];
        for (var i = 0; i < controlData.reelLength; i++) {
            array.push(data_view.getUint8(pos++, false))
        }
        return array
    });
    controlData.yakuList = Array(controlData.yakuCount).fill(0).map(function () {
        return [data_view.getUint16(pos, false), pos += 2][0]
    })

    controlData.betLine = Array(controlData.maxLine).fill(0).map(function () {
        var array = [];
        for (i = 0; i < 4; i++) {
            array.push(data_view.getUint8(pos++, false))
        }
        return array
    })

    controlData.slideTable = [
        [],
        [],
        []
    ];
    controlData.tableSize = Math.floor((controlData.reelLength + 1) / 2);

    controlData.slideTableSize = [];

    for (var i = 0; i < 3; i++) {
        controlData.slideTableSize[i] = [data_view.getUint16(pos, false) * controlData.tableSize, pos += 2][0]
    }

    controlData.tableNum23IndexSize = [0, 0, 0]
    for (var i = 0; i < 3; i++) {
        controlData.tableNum23IndexSize[i] = [data_view.getUint16(pos, false) + 1, pos += 2][0]
    }
    controlData.tableNumSize = data_view.getUint8(pos++, false);
    controlData.tableNum23NumSize = data_view.getUint8(pos++, false);

    for (var i = 0; i < 3; i++) {
        controlData.slideTable[i] = [];
        for (var k = 0; k < controlData.slideTableSize[i]; k++) {
            controlData.slideTable[i].push(data_view.getUint8(pos++, false))
        }
    }

    controlData.tableNum1Size = controlData.controlCount * 3 * controlData.tableNumSize;
    controlData.tableNum1 = [];

    for (var i = 0; i < controlData.tableNum1Size; i++) {
        controlData.tableNum1.push(data_view.getUint8(pos++, false))
    }
    controlData.tableNum23Index = new Array(3);
    for (var i = 0; i < 3; i++) {
        controlData.tableNum23Index[i] = [0];
        for (var k = 1; k < controlData.tableNum23IndexSize[i]; k++) {
            controlData.tableNum23Index[i].push([data_view.getUint16(pos, false), pos += 2][0])
        }
    }
    controlData.tableNum23 = [];
    for (var i = 0; i < 3; i++) {
        controlData.tableNum23[i] = [];
        var tableNum23Size = controlData.tableNum23Index[i][controlData.tableNum23Index[i].length - 1] * controlData.tableNumSize;
        for (var k = 0; k < tableNum23Size; k++) {
            controlData.tableNum23[i].push(data_view.getUint8(pos++, false))
        }
    }
    controlData.tableNum23NumIndex = [];
    controlData.tableNum23NumIndex.push(0)
    for (var i = 1; i < controlData.controlCount * 6 + 1; i++) {
        controlData.tableNum23NumIndex[i] = [data_view.getUint16(pos, false), pos += 2][0]
    }
    controlData.tableNum23Num = [];
    for (var i = 0; i < controlData.tableNum23NumIndex[controlData.controlCount * 6] * controlData.tableNum23NumSize; i++) {
        controlData.tableNum23Num.push(data_view.getUint8(pos++, false))
    }
    reelControl = new reelControlData(controlData)
    window.slotmodule = new SlotModuleMk2();
    $(main)

}
xhr.send();

function main() {
    window.scrollTo(0, 0);

    var notplaypaysound = false;

    slotmodule.on("allreelstop", function (e) {
        var $ele = $("#nabi");


        if (e.hits != 0) {
            if (e.hityaku.length == 0)
                return
            var matrix = e.hityaku[0].matrix;
            var count = 0;
            slotmodule.once("bet", function () {
                slotmodule.clearFlashReservation()
                segments.payseg.reset();
            })
            if (e.hityaku[0].name.indexOf("Dummy") != -1||e.hityaku[0].name.indexOf("1枚役") != -1) {
                notplaypaysound = true;
            } else {
                notplaypaysound = false;
                slotmodule.setFlash(null, 0, function (e) {
                    slotmodule.setFlash(flashdata.default, 20)
                    slotmodule.setFlash(replaceMatrix(flashdata.default, matrix, colordata.LINE_F, null), 20, arguments.callee)
                })
            }
        }
        if (gamemode == "big") {
            bonusdata.bonusgame--;
            changeBonusSeg()
        }

        if (gamemode == "jac" || gamemode == "reg") {
            bonusdata.jacgamecount--;
            changeBonusSeg()
        }

        replayflag = false;
        var nexter = true;

        e.hityaku.forEach(function (d) {
            switch (gamemode) {
                case 'normal':
                    switch (d.name) {
                        case "赤7":
                        case "白7":
                        case "BAR":
                            sounder.stopSound("bgm");
                            setGamemode('big');
                            sounder.playSound("big" + (["赤7", "白7", "BAR"].indexOf(d.name) + 1), true)
                            bonusdata = {
                                bonusget: 360,
                                geted: 0
                            }
                            bonusflag = "none";
                            changeBonusSeg()
                            isCT = false;
                            isSBIG = true;
                            clearLamp()
                            break;
                        case "REG1":
                        case "REG2":
                            setGamemode('reg');
                            sounder.stopSound("bgm");
                            sounder.playSound("reg1", true, null, 0.735);
                            bonusdata = {
                                bonusget: 120,
                                geted: 0
                            }
                            changeBonusSeg();
                            bonusflag = "none";
                            clearLamp()
                            break;
                        case "リプレイ":
                            replayflag = true;
                            break;
                    }

                    break;
                case 'big':
                    if (d.name == "リプレイ") {
                        setGamemode('jac');
                        bonusdata.jacincount--;
                        bonusdata.jacgamecount = 8;
                        bonusdata.jacgetcount = 8;

                    }
                    changeBonusSeg()
                    break;
                case 'reg':
                case 'jac':
                    bonusdata.jacgetcount--;
                    changeBonusSeg()
            }
        })
        if (gamemode == "big" && bonusdata.bonusgame == 0) {
            setGamemode('normal');
            sounder.stopSound("bgm")
            segments.effectseg.reset();
            slotmodule.once("payend", function () {
                isCT = CTBIG;
                if (isCT) {
                    if (!ctNoticed) {
                        sounder.playSound("ctstart", false, function () {
                            sounder.playSound("ct1", true)
                        })
                    } else {
                        sounder.playSound("ct1", true)
                    }
                    ctdata = {
                        ctstartcoin: coin,
                        ctgame: 150
                    }
                }
            })
        }

        if (nexter) {
            e.stopend()
        }
    })

    slotmodule.on("payend", function () {
        if (gamemode != "normal") {
            if (bonusdata.geted >= bonusdata.bonusget) {
                slotmodule.emit("bonusend");
                setGamemode("normal")

            }
        }
    })
    slotmodule.on("leveron", function () {

    })

    slotmodule.on("bet", function (e) {
        sounder.playSound("3bet")
        if ("coin" in e) {
            (function (e) {
                var thisf = arguments.callee;
                if (e.coin > 0) {
                    coin--;
                    e.coin--;
                    incoin++;
                    changeCredit(-1);
                    setTimeout(function () {
                        thisf(e)
                    }, 30)
                } else {
                    e.betend();
                }
            })(e)
        }
    })

    slotmodule.on("pay", function (e) {
        var pays = e.hityaku.pay;
        var arg = arguments;
        if (gamemode != "normal") {
            changeBonusSeg();
        }
        if (!("paycount" in e)) {
            e.paycount = 0
            replayflag || notplaypaysound || sounder.playSound("pay", true);
        }
        if (pays == 0) {
            if (replayflag) {
                sounder.playSound("replay", false, function () {
                    e.replay();
                    slotmodule.emit("bet", e.playingStatus);
                });
            } else {
                e.payend()
                sounder.stopSound("pay")
            }
        } else {
            e.hityaku.pay--;
            coin++;
            e.paycount++;
            outcoin++;
            if (gamemode != "normal") {
                bonusdata.geted++;
            }
            changeCredit(1);
            segments.payseg.setSegments(e.paycount)
            setTimeout(function () {
                arg.callee(e)
            }, 40)
        }
    })
    slotmodule.on("lot", function (e) {
        var ret = -1;
        switch (gamemode) {
            case "normal":
                var lot = normalLotter.lot().name

                lot = window.power || lot;
                window.power = undefined

                switch (lot) {
                    case "リプレイ":
                        ret = lot
                        break;
                    case "ベル":
                    case "スイカ":
                    case "チェリー":
                        ret = lot;
                        break;
                    case "BIG":
                        if (bonusflag == "none") {
                            var bonus_color = rand(3) + 1;
                            ret = "BIG" + (bonus_color * 2 - rand(2));
                            bonusflag = "BIG" + (bonus_color * 2 - 1);
                            slotmodule.once("leveron", function () {
                                slotmodule.once("leveron", function () {
                                    if (gamemode == "normal") {
                                        if (rand(4) == 0) {
                                            switch(rand(4)){
                                                case 0:
                                                    setLamp([true, true], 500)
                                                    break;
                                                case 1:
                                                    setLamp([true, false], 100)
                                                    break;
                                                case 2:
                                                    setLamp([false, true], 100)
                                                    break;
                                                case 3:
                                                    setLamp([true, true], 50)
                                                    break;
                                            }
                                        } else {
                                            setLamp([true, true], 100)
                                        }
                                    }
                                })
                            })
                            slotmodule.once("bonusend", function () {
                                sounder.stopSound("bgm");
                            })
                            if(rand(1)==0){
                                okure = true;
                            }
                        } else {
                            ret = bonusflag;
                        }
                        break;
                    case "REG":
                        if (bonusflag == "none") {
                            ret = "REG";
                            bonusflag = "REG"
                            slotmodule.once("leveron", function () {
                                slotmodule.once("leveron", function () {
                                    gamemode == "normal" && setLamp([true, true], 100)
                                })
                            })
                            slotmodule.once("bonusend", function () {
                                sounder.stopSound("bgm");
                            })
                        } else {
                            ret = bonusflag;
                        }
                        break;
                    default:
                        ret = "はずれ"
                        if (bonusflag != "none") {
                            ret = bonusflag;
                        }
                }

                break;
            case "big":
                ret = "BIG子役"
                break;
            case "reg":
                ret = "BIG子役"
                break;
        }
        effect(ret);
        return ret;
    })

    slotmodule.on("reelstop", function () {
        sounder.playSound("stop")
    })

    $("#saveimg").click(function () {
        SaveDataToImage();
    })

    $("#cleardata").click(function () {
        if (confirm("データをリセットします。よろしいですか？")) {
            ClearData();
        }
    })

    $("#loadimg").click(function () {
        $("#dummyfiler").click();
    })

    $("#dummyfiler").change(function (e) {

        var file = this.files[0];

        var image = new Image();
        var reader = new FileReader();
        reader.onload = function (evt) {
            image.onload = function () {
                var canvas = $("<canvas></canvas>")
                canvas[0].width = image.width;
                canvas[0].height = image.height;
                var ctx = canvas[0].getContext('2d');
                ctx.drawImage(image, 0, 0)
                var imageData = ctx.getImageData(0, 0, canvas[0].width, canvas[0].height)
                var loadeddata = SlotCodeOutputer.load(imageData.data);
                if (loadeddata) {
                    parseSaveData(loadeddata)
                    alert("読み込みに成功しました")
                } else {
                    alert("データファイルの読み取りに失敗しました")
                }
            }
            image.src = evt.target.result;
        }
        reader.onerror = function (e) {
            alert("error " + e.target.error.code + " \n\niPhone iOS8 Permissions Error.");
        }
        reader.readAsDataURL(file)
    })

    slotmodule.on("reelstart", function () {
        if(okure){
            setTimeout(function(){
                sounder.playSound("start")
            },100)
        }else{
            sounder.playSound("start")
        }
        okure = false;
    })
    var okure = false;
    var sounder = new Sounder();

    sounder.addFile("sound/stop.wav", "stop").addTag("se");
    sounder.addFile("sound/start.wav", "start").addTag("se");
    sounder.addFile("sound/bet.wav", "3bet").addTag("se");
    sounder.addFile("sound/pay.wav", "pay").addTag("se");
    sounder.addFile("sound/replay.wav", "replay").addTag("se");
    sounder.addFile("sound/big1.mp3", "big1").addTag("bgm").setVolume(0.2);
    sounder.addFile("sound/big2.mp3", "big2").addTag("bgm").setVolume(0.5);
    sounder.addFile("sound/big3.mp3", "big3").addTag("bgm").setVolume(0.5);
    sounder.addFile("sound/handtohand.mp3", "hand").addTag("voice").addTag("se");
    sounder.addFile("sound/gotit.wav", "gotit").addTag("voice").addTag("se");
    sounder.addFile("sound/big1hit.wav", "big1hit").addTag("se");
    sounder.addFile("sound/CT1.mp3", "ct1").addTag("bgm");
    sounder.addFile("sound/ctstart.wav", "ctstart").addTag("se");
    sounder.addFile("sound/yattyare.wav", "yattyare").addTag("voice").addTag("se");
    sounder.addFile("sound/delive.wav", "delive").addTag("voice").addTag("se");
    sounder.addFile("sound/reg1.mp3", "reg1").addTag("bgm");
    sounder.addFile("sound/big2.mp3", "big2").addTag("bgm");
    sounder.addFile("sound/reglot.mp3", "reglot").addTag("se");
    sounder.addFile("sound/bigselect.mp3", "bigselect").addTag("se")
    sounder.addFile("sound/syoto.mp3", "syoto").addTag("se")
    sounder.addFile("sound/kokutise.mp3", "kokutise").addTag("se");
    sounder.addFile("sound/widgetkokuti.mp3", "widgetkokuti").addTag("voice").addTag("se");

    sounder.addFile("sound/mistcrack.mp3", "mistcrack").addTag("voice").addTag("se");
    sounder.addFile("sound/widgetacrack.mp3", "widgetacrack").addTag("voice").addTag("se");
    sounder.addFile("sound/alinercrack.wav", "alinercrack").addTag("voice").addTag("se");
    sounder.addFile("sound/lalishcrack.mp3", "lalishcrack").addTag("voice").addTag("se");
    sounder.addFile("sound/gritcrack.wav", "gritcrack").addTag("voice").addTag("se");
    sounder.addFile("sound/anycrack.mp3", "anycrack").addTag("voice").addTag("se")

    sounder.loadFile(function () {
        window.sounder = sounder
        console.log(sounder)
    })

    var normalLotter = new Lotter(lotdata.normal);
    var bigLotter = new Lotter(lotdata.big);
    var jacLotter = new Lotter(lotdata.jac);


    var black = true;
    if(black){
        var stock = {
            big:0,
            reg:0,
            rt:null
        };
        var zyotai = false;
        normalLotter.pipe(function(lot){
            switch(lot.name){
                case "BIG":
                    if(rand(2)==0){
                        zyotai = true;
                        stock.rt = rand(32)+1;
                    }else{
                        lot.name = null
                        stock.big++;
                    }
                    break;
            }
            if(zyotai){
                if(bonusflag=="none"){
                    if(stock.rt == null){
                        zyotai = false;
                    }else{
                        stock.rt--;
                        if(stock.rt==0){
                            if(rand(2)==0){
                                stock.rt = rand(32)+1;
                            }else{
                                stock.rt = null;
                            }
                            if(rand(3)!=0){
                                lot.name = "BIG"
                            }else{
                                lot.name = "REG"
                                stock.rt = rand(32)+1;
                            }
                        }
                    }
                }
            }
            return lot
        })
    }

    var gamemode = "normal";
    var bonusflag = "none"
    var coin = 0;

    var bonusdata;
    var replayflag;

    var isCT = false;
    var CTBIG = false;
    var isSBIG;
    var ctdata = {};
    var regstart;

    var afterNotice;
    var bonusSelectIndex;
    var ctNoticed;

    var playcount = 0;
    var allplaycount = 0;

    var incoin = 0;
    var outcoin = 0;

    var bonuscounter = {
        count: {},
        history: []
    };

    slotmodule.on("leveron", function () {

        if (gamemode == "normal") {
            playcount++;
            allplaycount++;
        } else {
            if (playcount != 0) {
                bonuscounter.history.push({
                    bonus: gamemode,
                    game: playcount
                })
                playcount = 0;
            }
        }
        changeCredit(0)
    })

    function stringifySaveData() {
        return {
            coin: coin,
            playcontroldata: slotmodule.getPlayControlData(),
            bonuscounter: bonuscounter,
            incoin: incoin,
            outcoin: outcoin,
            playcount: playcount,
            allplaycount: allplaycount,
            name: "はにゃはにゃ",
            id: "nya"
        }
    }

    function parseSaveData(data) {
        coin = data.coin;
        slotmodule.setPlayControlData(data.playcontroldata)
        bonuscounter = data.bonuscounter
        incoin = data.incoin;
        outcoin = data.outcoin;
        playcount = data.playcount;
        allplaycount = data.allplaycount
        changeCredit(0)
    }

    window.SaveDataToImage = function () {
        SlotCodeOutputer.save(stringifySaveData())
    }

    window.SaveData = function () {
        if (gamemode != "normal" || isCT) {
            return false;
        }
        var savedata = stringifySaveData()
        localStorage.setItem("savedata", JSON.stringify(savedata))
        return true;
    }

    window.LoadData = function () {
        if (gamemode != "normal" || isCT) {
            return false;
        }
        var savedata = localStorage.getItem("savedata")
        try {
            var data = JSON.parse(savedata)
            parseSaveData(data)
            changeCredit(0)
        } catch (e) {
            return false;
        }
        return true;
    }

    window.ClearData = function () {
        coin = 0;
        bonuscounter = {
            count: {},
            history: []
        };
        incoin = 0;
        outcoin = 0;
        playcount = 0;
        allplaycount = 0;

        SaveData();
        changeCredit(0)
    }


    var setGamemode = function (mode) {
        switch (mode) {
            case 'normal':
                gamemode = 'normal'
                slotmodule.setLotMode(0)
                slotmodule.setMaxbet(3);
                isSBIG = false
                break;
            case 'big':
                gamemode = 'big';
                slotmodule.once("payend", function () {
                    slotmodule.setLotMode(1)
                });
                slotmodule.setMaxbet(1);
                break;
            case 'reg':
                gamemode = 'reg';
                slotmodule.once("payend", function () {
                    slotmodule.setLotMode(1)
                });
                slotmodule.setMaxbet(1);
                break;
        }
    }

    var segments = {
        creditseg: segInit("#creditSegment", 2),
        payseg: segInit("#paySegment", 2),
        effectseg: segInit("#effectSegment", 4)
    }

    var credit = 50;
    segments.creditseg.setSegments(50);
    segments.creditseg.setOffColor(80, 30, 30);
    segments.payseg.setOffColor(80, 30, 30);
    segments.creditseg.reset();
    segments.payseg.reset();


    var lotgame;

    function changeCredit(delta) {
        credit += delta;
        if (credit < 0) {
            credit = 0;
        }
        if (credit > 50) {
            credit = 50;
        }
        $(".GameData").text("差枚数:" + coin + "枚  ゲーム数:" + playcount + "G  総ゲーム数:" + allplaycount + "G")
        segments.creditseg.setSegments(credit)
    }

    function changeBonusSeg() {
        segments.effectseg.setSegments("" + (bonusdata.bonusget - bonusdata.geted));

    }

    function changeCTGameSeg() {
        segments.effectseg.setOnColor(230, 0, 0);
        segments.effectseg.setSegments(ctdata.ctgame);
    }

    function changeCTCoinSeg() {
        segments.effectseg.setOnColor(50, 100, 50);
        segments.effectseg.setSegments(200 + ctdata.ctstartcoin - coin);
    }

    var LampInterval = {
        right: -1,
        left: -1,
        counter: {
            right: true,
            left: false
        }
    }

    function setLamp(flags, timer) {
        flags.forEach(function (f, i) {
            if (!f) {
                return
            }
            LampInterval[["left", "right"][i]] = setInterval(function () {
                if (LampInterval.counter[["left", "right"][i]]) {
                    $("#" + ["left", "right"][i] + "neko").css({
                        filter: "brightness(200%)"
                    })
                } else {
                    $("#" + ["left", "right"][i] + "neko").css({
                        filter: "brightness(100%)"
                    })
                }
                LampInterval.counter[["left", "right"][i]] = !LampInterval.counter[["left", "right"][i]];
            }, timer)
        })
    }

    function clearLamp() {
        clearInterval(LampInterval.right);
        clearInterval(LampInterval.left);
        ["left", "right"].forEach(function (i) {
            $("#" + i + "neko").css({
                filter: "brightness(100%)"
            })
        })

    }


    function effect(lot) {
    }


    $(window).bind("unload", function () {
        SaveData();
    });

    LoadData();
}

function and() {
    return Array.prototype.slice.call(arguments).every(function (f) {
        return f
    })
}

function or() {
    return Array.prototype.slice.call(arguments).some(function (f) {
        return f
    })
}

function rand(m) {
    return Math.floor(Math.random() * m);
}

function replaceMatrix(base, matrix, front, back) {
    var out = JSON.parse(JSON.stringify(base));
    matrix.forEach(function (m, i) {
        m.forEach(function (g, j) {
            if (g == 1) {
                front && (out.front[i][j] = front);
                back && (out.back[i][j] = back);
            }
        })
    })
    return out
}

function flipMatrix(base) {
    var out = JSON.parse(JSON.stringify(base));
    return out.map(function (m) {
        return m.map(function (p) {
            return 1 - p;
        })
    })
}

function segInit(selector, size) {
    var cangvas = $(selector)[0];
    var sc = new SegmentControler(cangvas, size, 0, -3, 79, 46);
    sc.setOffColor(120, 120, 120)
    sc.setOnColor(230, 0, 0)
    sc.reset();
    return sc;
}