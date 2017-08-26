var Jimp = require("jimp");
var fs = require('fs')

Jimp.read(process.argv[2], function(err, lenna) {
        if (err) throw err;
        var width = lenna.bitmap.width;
        var height = lenna.bitmap.height;
        var jsonobj = {};
        jsonobj.meta = {
                image: process.argv[2].match(/([^\\]+?)?$/)[0],
                format: "RGBA8888",
                size: {
                        w: width,
                        h: height
                },
                scale: 1
        }

        jsonobj.frames = {};

        for (i = 0; i < process.argv[3]; i++) {
                jsonobj.frames["reelchip" + i] = {
                        frame: {
                                x: 0,
                                y: height / process.argv[3] * i,
                                w: width,
                                h: height / process.argv[3]
                        },
                        rotated: false,
                        trimmed: false,
                        spritSourceSize: {
                                x: 0,
                                y: 0,
                                w: width,
                                h: height / process.argv[3]
                        },
                        sourceSize: {
                                w: width,
                                h: height / process.argv[3]
                        }
                }
        }
        fs.writeFile('reelchip.json', JSON.stringify(jsonobj), function() {})
})
