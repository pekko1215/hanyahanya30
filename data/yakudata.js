/**
 * Created by pekko1215 on 2017/07/15.
 */
var YakuData = [
    {
        name: "はずれ",
        pay: [0, 0, 0]
    },
    {
        name: "リプレイ",
        pay: [0, 0, 0]
    },
    {
        name: "ベル",
        pay: [10, 15, 0]
    },
    {
        name: "スイカ",
        pay: [1, 0, 0]
    },
    {
        name: "チェリー",
        pay: [4, 0, 0]
    },
    {
        name: "赤7",
        pay: [0, 0, 0]
    },
    {
        name: "白7",
        pay: [0, 0, 0]
    },
    {
        name: "BAR",
        pay: [0, 0, 0]
    },
    {
        name: "REG1",
        pay: [0, 0, 0]
    },
    {
        name: "REG2",
        pay: [0, 0, 0]
    }
]

for (var i = 0; i < 13; i++) {
    YakuData.push({
        name: "Dummy" + (i + 1),
        pay: [0, 0, 0]
    })
}
YakuData.push({
    name: "1枚役",
    pay: [1, 0, 0]
});
YakuData.push({
    name: "BIG中子役1",
    pay: [0, 15, 0]
});
YakuData.push({
    name: "BIG中子役2",
    pay: [0, 14, 0]
});