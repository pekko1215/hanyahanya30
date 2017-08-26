function reelControlData(controlData) {
        this.controlData = controlData;
}
reelControlData.prototype.getStopPos = function(reel, num, pos) {
        var slide = this.controlData.slideTable[reel][num * this.controlData.tableSize + Math.floor(pos / 2)];
        if ((pos & 1) == 0) {
                slide = slide >> 4
        } else {
                slide = slide & 0x0F
        }
        var ret = pos - slide;
        if (ret < 0) {
                ret += this.controlData.reelLength;
        }
        return ret;
}

reelControlData.prototype.getStopPosIndex = function(reel, num, pos) {
        var flags = 0;
        var ret = 0;

        for (var i = 0; i < this.controlData.reelLength; i++) {
                var p = this.getStopPos(reel, num, i);
                flags = flags | (1 << p);
        }
        if ((flags & (1 << pos)) == 0) {
                return -1;
        }
        for (var i = 0; i < pos; i++) {
                if ((flags & (1 << i)) != 0) {
                        ret++;
                }
        }
        return ret;
}

reelControlData.prototype.readData = function(b, idx, isShort) {
        if (isShort) {
                return ((b[idx * 2] & 0xFF) << 8) | (b[idx * 2 + 1] & 0xFF);
        }
        return b[idx] & 0xFF;
}

reelControlData.prototype.getStopPos1st = function(controlNum, reel, pos) {
        var num = this.readData(this.controlData.tableNum1, controlNum * 3 + reel, this.controlData.tableNumSize == 2);
        var ret = this.getStopPos(reel, num, pos);
        this.controlNum = controlNum;
        this.stopReel1st = reel;
        this.stopPosIdx1st = this.getStopPosIndex(reel, num, ret);
        return ret;
}

reelControlData.prototype.getStopPos2nd = function(reel, pos) {
        var stopPattern;
        switch (this.stopReel1st) {
                case 0:
                        stopPattern = (reel - 1);
                        break;
                case 1:
                        stopPattern = (reel == 0 ? 2 : 3);
                        break;
                default:
                        stopPattern = (reel == 0 ? 4 : 5);
        }
        var idx = this.controlNum * 6 + stopPattern;
        var idx2 = this.controlData.tableNum23NumIndex[idx];
        if (this.controlData.tableNum23NumIndex[idx+1] - idx2 == 1) {
                this.stopPosIdx1st = 0;
        }
        var num23num = this.readData(this.controlData.tableNum23Num, idx2 + this.stopPosIdx1st, this.controlData.tableNum23NumSize == 2);
        this.num23Idx = this.controlData.tableNum23Index[this.stopReel1st][num23num];
        var num = this.readData(this.controlData.tableNum23[this.stopReel1st], this.num23Idx, this.controlData.tableNumSize == 2);
        var ret = this.getStopPos(reel, num, pos);
        this.stopPosIdx2nd = this.getStopPosIndex(reel, num, ret);
        if (this.controlData.tableNum23Index[this.stopReel1st][num23num + 1] - this.num23Idx == 2) {
                this.stopPosIdx2nd = 0;
        }
        return ret;
}

reelControlData.prototype.getStopPos3rd = function(reel, pos) {
        var num = this.readData(this.controlData.tableNum23[this.stopReel1st], this.num23Idx + this.stopPosIdx2nd + 1, this.controlData.tableNumSize == 2);
        var ret = this.getStopPos(reel, num, pos);
        return ret;
}
