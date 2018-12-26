// import * as fs from "fs";
import * as jimp from "jimp";

import * as fsExc from "./FsExecute.js";
import * as global from "./Global.js";

export function jimpPng(cell, input_path, output_path) {
    return new Promise(async (resolve, reject) => {
        const element = cell;
        let area = element.area;
        let texture = element.texture;
        let filePath = input_path + "/" + texture + ".png";

        if (!(await fsExc.exists(filePath))) {
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

                for (let row = area.length - 1; row >= 0; row--) {
                    for (let col = area[row].length - 1; col >= 0; col--) {
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
                        if (row != 0 && col != 0) {
                            type = 1;
                            startX = 0;
                            startY = 0;
                            itemHigh = 0;
                            lengthX = 0;
                        } else if (row == 0 && col == 0) {
                            type = 2;
                            startX = -tileWidth / 2;
                            startY = (-(row + col) * tileHeight) / 2;
                            itemHigh = ((row + col) * tileHeight) / 2;
                            lengthX = tileWidth / 2;
                        } else if (col == 0) {
                            type = 3;
                            startX = -tileWidth / 2;
                            startY = (-(row + col) * tileHeight) / 2;
                            itemHigh = ((row + col) * tileHeight) / 2;
                            lengthX = 0;
                        } else if (row == 0) {
                            type = 4;
                            startX = 0;
                            startY = (-(row + col) * tileHeight) / 2;
                            itemHigh = ((row + col) * tileHeight) / 2;
                            lengthX = tileWidth / 2;
                        } else {
                            //reserve
                        }

                        gridHeight = imageHeight - ((tileRow + tileCol) * tileHeight) / 2 + itemHigh + 10;
                        let originX = imageWidth - (tileRow * tileWidth) / 2 - tileWidth / 2;
                        let originY = imageHeight - tileHeight - gridHeight;
                        let lengthY = gridHeight + tileHeight;
                        let itemX = originX + ((area.length - 1 - row - (area[row].length - 1 - col)) * tileWidth) / 2;
                        let itemY = originY - ((area.length - 1 - row + area[row].length - 1 - col) * tileHeight) / 2;

                        let newImage = new jimp(tileWidth, tileHeight + gridHeight);
                        for (let pointY = startY; pointY <= lengthY; pointY++) {
                            for (let pointX = startX; pointX <= lengthX; pointX++) {
                                let pixelX = itemX + pointX + tileWidth / 2;
                                let pixelY = itemY + pointY;
                                let hex;
                                if (pixelX < 0 || pixelX > imageWidth || pixelY < 0 || pixelY > imageHeight) {
                                    hex = 0;
                                } else {
                                    hex = originImage.getPixelColor(pixelX, pixelY);
                                }
                                // hex = 3904926462;
                                newImage.setPixelColor(hex, pointX + tileWidth / 2, pointY);
                            }

                            if (type == 1 && pointY <= gridHeight + tileHeight / 2) {
                                startX -= 2;
                                lengthX = Math.abs(startX);
                            }

                            if (type == 3 && pointY > itemHigh) {
                                lengthX += 2;
                            }

                            if (type == 4 && pointY > itemHigh) {
                                startX -= 2;
                            }

                            if (pointY > gridHeight + tileHeight / 2) {
                                startX += 2;
                                lengthX = Math.abs(startX);
                                // lengthX += 2;
                            }
                        }

                        await newImage.write(output_path + "/" + texture + "_" + row + "_" + col + ".png");
                    }
                }

                resolve();
            }).catch(error => {
                global.snack(`裁剪纹理错误 id:${element.id}`, error);
                resolve();
            });
    });
}