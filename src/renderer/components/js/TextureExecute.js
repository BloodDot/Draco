import { ipcRenderer } from "electron";
import * as fs from "fs";
import * as jimp from "jimp";
import * as cpy from "cpy";
import * as copy from "copy";

import { global } from "./Global.js";

function jimpPng(cell, input_path, output_path) {
    return new Promise((resolve, reject) => {
        const element = cell;
        let area = element.area;
        let texture = element.texture;
        let filePath = input_path + "/" + texture + ".png";

        if (!fs.existsSync(filePath)) {
            // console.error("文件不存在:" + filePath);
            resolve();
            return;
        }

        jimp
            .read(filePath)
            .then(async originImage => {
                let imageWidth = originImage.bitmap.width;
                let imageHeight = originImage.bitmap.height;
                let tileHeight = 60;
                let tileWidth = 120;
                let tileRow = area.length;
                let tileCol = area[0].length;

                if (area.length == 1 && area[0].length == 1) {
                    originImage.write(output_path + "/" + texture + ".png", (error, img) => {
                        if (!error) {
                            resolve();
                        } else {
                            reject();
                            console.error(error);
                        }
                    });

                    return;
                }

                for (let m = area.length - 1; m >= 0; m--) {
                    for (let n = area[m].length - 1; n >= 0; n--) {
                        /**
                         * type
                         * 
                         * 1:
                         *  /\
                         *  \/
                         *
                         * 2:
                         *  ____
                         *  |  |
                         *  |  |
                         *  |  |
                         *   \/
                         *
                         * 3:
                         *  ____
                         *  ||
                         *  ||
                         *  | \
                         *   \/
                         *
                         * 4:
                         *  ____
                         *    ||
                         *    ||
                         *   / |
                         *   \/
                         */
                        let type;
                        let startX;
                        let startY;
                        let gridHeight;
                        let itemHigh;
                        let lengthX;
                        if (m != 0 && n != 0) {
                            type = 1;
                            startX = 0;
                            startY = 0;
                            itemHigh = 0;
                            lengthX = 0;
                        } else if (m == 0 && n == 0) {
                            type = 2;
                            startX = -tileWidth / 2;
                            startY = (-(m + n) * tileHeight) / 2;
                            itemHigh = ((m + n) * tileHeight) / 2;
                            lengthX = tileWidth / 2;
                        } else if (n == 0) {
                            type = 3;
                            startX = -tileWidth / 2;
                            startY = (-(m + n) * tileHeight) / 2;
                            itemHigh = ((m + n) * tileHeight) / 2;
                            lengthX = 0;
                        } else if (m == 0) {
                            type = 4;
                            startX = 0;
                            startY = (-(m + n) * tileHeight) / 2;
                            itemHigh = ((m + n) * tileHeight) / 2;
                            lengthX = tileWidth / 2;
                        } else {
                            //reserve
                        }

                        gridHeight = imageHeight - ((tileRow + tileCol) * tileHeight) / 2 + itemHigh + 10;
                        let originX = imageWidth - (tileRow * tileWidth) / 2 - tileWidth / 2;
                        let originY = imageHeight - tileHeight - gridHeight;
                        let lengthY = gridHeight + tileHeight;
                        let itemX =
                            originX +
                            ((area.length - 1 - m - (area[m].length - 1 - n)) * tileWidth) / 2;
                        let itemY =
                            originY - ((area.length - 1 - m + area[m].length - 1 - n) * tileHeight) / 2;

                        let newImage = new jimp(tileWidth, tileHeight + gridHeight);
                        for (let m = startY; m <= lengthY; m++) {
                            for (let n = startX; n <= lengthX; n++) {
                                let px = itemX + n + tileWidth / 2;
                                let py = itemY + m;
                                let hex;
                                if (px < 0 || px > imageWidth || py < 0 || py > imageHeight) {
                                    hex = 0;
                                } else {
                                    hex = originImage.getPixelColor(px, py);
                                }
                                // hex = 3904926462;
                                newImage.setPixelColor(hex, n + tileWidth / 2, m);
                            }

                            if (type == 1 && m <= gridHeight + tileHeight / 2) {
                                startX -= 2;
                                lengthX = Math.abs(startX);
                            }

                            if (type == 3 && m > itemHigh) {
                                lengthX += 2;
                            }

                            if (type == 4 && m > itemHigh) {
                                startX -= 2;
                            }

                            if (m > gridHeight + tileHeight / 2) {
                                startX += 2;
                                lengthX = Math.abs(startX);
                                // lengthX += 2;
                            }
                        }

                        await newImage.write(
                            output_path + "/" + texture + "_" + m + "_" + n + ".png"
                        );
                    }
                }

                resolve();
            }).catch(error => {
                global.snack(`裁剪纹理错误 id:${element.id}`, error);
                resolve();
            });
    });
}

export const textureExc = {
    jimpPng
}