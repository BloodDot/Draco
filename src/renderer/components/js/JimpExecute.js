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
                let tileWidth = 120;
                let tileHeight = 60;
                let halfTileWidth = tileWidth / 2;
                let halfTileHeight = tileHeight / 2;
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

                for (let rowLen = area.length, row = rowLen - 1; row >= 0; row--) {
                    for (let colLen = area[row].length, col = colLen - 1; col >= 0; col--) {
                        /**
                         * type
                         * 
                         * 
                         * 1: 上下都没
                         * rowLen > 1 && colLen > 1
                         * row != 0 && col != 0 && row !=rowLen-1 && col != colLen-1
                         *  /\
                         *  \/
                         *
                         * 2: 上有下没
                         * rowLen > 1 && colLen > 1
                         * row == 0 && col == 0
                         *  ----
                         *  |  |
                         *   \/
                         *
                         * 3: 上有下没
                         * rowLen > 1 && colLen > 1
                         * row != 0 && col == 0
                         *  --
                         *  ||
                         *  ||
                         *  | \
                         *   \/
                         * 
                         * 4: 上有下没
                         * rowLen > 1 && colLen > 1
                         * row == 0 && col != 0
                         *    --
                         *    ||
                         *    ||
                         *   / |
                         *   \/
                         * 
                         * 5: 上没下有
                         * rowLen > 1 && colLen > 1
                         * row == rowLen-1 && col == colLen-1
                         *  /\
                         * |  |
                         * ----
                         * 
                         * 6: 上没下有
                         * rowLen > 1 && colLen > 1
                         * row == rowLen-1 && col != 0
                         *  /\
                         * | /
                         * ||
                         * ||
                         * --
                         * 
                         * 7: 上没下有
                         * rowLen > 1 && colLen > 1
                         * row != 0 && col == colLen-1
                         *  /\
                         *  \ |
                         *   ||
                         *   ||
                         *   --
                         * 
                         * 8: 上下都有
                         * rowLen > 1 && colLen > 1
                         * row = rowLen-1 && col == 0
                         * --
                         * ||
                         * ||
                         * | \
                         * | /
                         * ||
                         * ||
                         * --
                         * 
                         * 9: 上下都有
                         * rowLen > 1 && colLen > 1
                         * row == 0 && col == colLen-1
                         *   --
                         *   ||
                         *   ||
                         *  / |
                         *  \ |
                         *   ||
                         *   ||
                         *   --
                         * 
                         * 10: 上没下有
                         * rowLen > 1 && colLen == 1
                         * row == 0
                         * ----
                         * |  |
                         *  \ |
                         *   ||
                         *   ||
                         *   --
                         * 
                         * 11: 上有下没
                         * rowLen > 1 && colLen == 1
                         * row == rowLen -1
                         * --
                         * ||
                         * ||
                         * | \
                         * |  |
                         * ----
                         * 
                         * 12: 上下都有
                         * rowLen > 1 && colLen == 1
                         * row != 0 && row != rowLen-1
                         *  --
                         *  ||
                         *  | \
                         **  \ |
                         *    ||
                         *    ||
                         *    --
                         * 
                         * 13: 上没下有
                         * rowLen == 1 && colLen > 1
                         * col == 0
                         * ----
                         * |  |
                         * | /
                         * ||
                         * ||
                         * --
                         * 
                         * 14: 上有下没
                         * rowLen == 1 && colLen > 1
                         * col == colLen - 1
                         *     --
                         *     ||
                         *     ||
                         *    / |
                         *   |  |
                         *   ----
                         * 
                         * 15: 上下都有
                         * rowLen == 1 && colLen > 1
                         * col != 0 && col != colLen -1
                         *     --
                         *     ||
                         *    / |
                         * * | /
                         *   ||
                         *   ||
                         *   --
                         * 
                         */
                        let type;
                        let startX;
                        let endX;
                        /** 除去格子外,图片上面所占的高度 */
                        let topImageHigh = imageHeight - (rowLen + colLen) * halfTileHeight;
                        /** 格子顶端离图片的高度 */
                        let topDistance = (row + col) * halfTileHeight + topImageHigh;
                        /** 格子底部离图片的高度 */
                        let bottomDistance = (rowLen - 1 - row + colLen - 1 - col) * halfTileHeight;

                        let topGridHigh = 0;    //切图后 格子顶部离图片的高度
                        let bottomGridHigh = 0; //切图后 格子底部离图片的高度
                        if (rowLen > 1 && colLen > 1) {
                            if (row != 0 && col != 0 && row != rowLen - 1 && col != colLen - 1) {
                                type = 1;
                                startX = 0;
                                endX = 0;
                            } else if (row == 0 && col == 0) {
                                type = 2;
                                startX = -halfTileWidth;
                                endX = halfTileWidth;
                                topGridHigh = topDistance;
                            } else if (row != 0 && col == 0) {
                                type = 3;
                                startX = -halfTileWidth;
                                endX = 0;
                                topGridHigh = topDistance;
                            } else if (row == 0 && col != 0) {
                                type = 4;
                                startX = 0;
                                endX = halfTileWidth;
                                topGridHigh = topDistance;
                            } else if (row == rowLen - 1 && col == colLen - 1) {
                                type = 5;
                                startX = 0;
                                endX = 0;
                                bottomGridHigh = bottomDistance;
                            } else if (row == rowLen - 1 && col != 0) {
                                type = 6;
                                startX = 0;
                                endX = 0;
                                bottomGridHigh = bottomDistance;
                            } else if (row != 0 && col == colLen - 1) {
                                type = 7;
                                startX = 0;
                                endX = 0;
                                bottomGridHigh = bottomDistance;
                            } else if (row == rowLen - 1 && col == 0) {
                                type = 8;
                                startX = -halfTileWidth;
                                endX = 0;
                                topGridHigh = topDistance;
                                bottomGridHigh = bottomDistance;
                            } else if (row == 0 && col == colLen - 1) {
                                type = 9;
                                startX = 0;
                                endX = halfTileWidth;
                                topGridHigh = topDistance;
                                bottomGridHigh = bottomDistance;
                            } else {
                                //reserve
                            }
                        } else if (rowLen > 1 && colLen == 1) {
                            if (row == 0) {
                                type = 10;
                                startX = -halfTileWidth;
                                endX = halfTileWidth;
                            } else if (row == rowLen - 1) {
                                type = 11;
                                startX = -halfTileWidth;
                                endX = 0;
                            } else {
                                type = 12;
                                startX = -halfTileWidth;
                                endX = 0;
                            }
                            topGridHigh = topDistance;
                            bottomGridHigh = bottomDistance;
                        } else if (rowLen == 1 && colLen > 1) {
                            if (col == 0) {
                                type = 13;
                                startX = -halfTileWidth;
                                endX = halfTileWidth;
                            } else if (col == colLen - 1) {
                                type = 14;
                                startX = 0;
                                endX = halfTileWidth;
                            } else {
                                type = 15;
                                startX = 0;
                                endX = halfTileWidth;
                            }
                            topGridHigh = topDistance;
                            bottomGridHigh = bottomDistance;
                        } else {
                            //reserve
                        }


                        // let gridHeight = imageHeight - (tileRow + tileCol) * halfTileHeight + topDistance + bottomDistance;
                        // let lengthY = gridHeight + tileHeight;
                        // let originX = imageWidth - tileRow * halfTileHeight - halfTileWidth;
                        // let originY = imageHeight - tileHeight - gridHeight;
                        // let itemX = originX + (area.length - 1 - row - area[row].length - 1 - col) * halfTileWidth;
                        // let itemY = originY - (area.length - 1 - row + area[row].length - 1 - col) * halfTileHeight;


                        let itemX = (rowLen - row + col) * halfTileWidth;
                        // let itemY = (row + col) * halfTileHeight;

                        // let startY = topDistance - topGridHigh;
                        // let endY = topDistance + tileHeight + bottomDistance;

                        let gapY = 2;
                        let startY = -gapY;
                        let endY = topGridHigh + tileHeight + bottomDistance;
                        let itemY = topDistance - topGridHigh;

                        let newImage = new jimp(tileWidth, topGridHigh + tileHeight + bottomGridHigh + gapY);
                        for (let pointY = startY; pointY <= endY; pointY++) {
                            let pixelY = itemY + pointY;
                            // for (let pointX = originStartX; pointX <= originEndX; pointX++) {
                            for (let pointX = startX; pointX <= endX; pointX++) {
                                let pixelX = itemX + pointX;
                                let hex;
                                if (pixelX < 0 || pixelX > imageWidth || pixelY < 0 || pixelY > imageHeight) {
                                    hex = 0;
                                } else {
                                    hex = originImage.getPixelColor(pixelX, pixelY);
                                }

                                // if (row == 0 && col == 0) {
                                //     console.log(`pointX:${pointX}, pointY:${pointY}, hex:${hex}`);
                                // }
                                // hex = 3904926462;
                                newImage.setPixelColor(hex, pointX + halfTileWidth, pointY + gapY);
                            }

                            //上部分
                            //上半格子
                            if (pixelY > topDistance - gapY
                                && pixelY <= topDistance + halfTileHeight - gapY) {
                                switch (type) {
                                    case 1:
                                    case 5:
                                    case 6:
                                    case 7:
                                        //形状为 /\
                                        //x向两边扩张
                                        startX -= 2;
                                        endX = Math.abs(startX);
                                        break;
                                    case 3:
                                        endX += 2;
                                        break;
                                    case 4:
                                        startX -= 2;
                                        break;
                                    case 8:
                                        endX += 2;
                                        break;
                                    case 9:
                                        startX -= 2;
                                        break;
                                    case 11:
                                        endX += 2;
                                        break;
                                    case 12:
                                        endX += 2;
                                        break;
                                    case 14:
                                        startX -= 2;
                                        break;
                                    case 15:
                                        startX -= 2;
                                        break;
                                    default:
                                        break;
                                }
                            }

                            //下部分
                            //下半格子
                            if (pixelY > topDistance + halfTileHeight
                                && pixelY <= topDistance + tileHeight) {
                                switch (type) {
                                    case 1:
                                    case 2:
                                    case 3:
                                    case 4:
                                        //x向里缩进
                                        startX += 2;
                                        endX = Math.abs(startX);
                                        break;
                                    case 6:
                                        endX -= 2;
                                        break;
                                    case 7:
                                        startX += 2;
                                        break;
                                    case 8:
                                        endX -= 2;
                                        break;
                                    case 9:
                                        startX += 2;
                                        break;
                                    case 10:
                                        startX -= 2;
                                        break;
                                    case 12:
                                        startX += 2;
                                        break;
                                    case 13:
                                        endX -= 2;
                                        break;
                                    case 15:
                                        endX -= 2;
                                        break;
                                    default:
                                        break;
                                }
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

var needConsole = true;
export function jimpPng2(cell, input_path, output_path) {
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
                let tileWidth = 120;
                let tileHeight = 60;
                let halfTileWidth = tileWidth / 2;
                let halfTileHeight = tileHeight / 2;

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

                let gapY = 2;

                // for (let rowLen = area.length, row = rowLen - 1; row >= 0; row--) {
                //     for (let colLen = area[row].length, col = colLen - 1; col >= 0; col--) {
                for (let rowLen = area.length, row = 0; row <= rowLen - 1; row++) {
                    for (let colLen = area[row].length, col = 0; col <= colLen - 1; col++) {
                        let topImageHigh = imageHeight - (rowLen + colLen) * halfTileHeight;
                        let topDistance = 0;
                        let bottomDistance = 0;

                        let hasTopLeft = false;
                        let hasTopRight = false;
                        let hasBottomLeft = false;
                        let hasBottomRight = false;


                        if (row == 0) {
                            //右上三角 右上方形(c)
                            topDistance = col * halfTileHeight + topImageHigh;
                            hasTopRight = true;
                        }

                        if (col == 0) {
                            //左上三角 左上方形(r)
                            topDistance = row * halfTileHeight + topImageHigh;
                            hasTopLeft = true;
                        }

                        if (row == rowLen - 1) {
                            //左下三角 左下方形(colLen-1-col)
                            bottomDistance = (colLen - 1 - col) * halfTileHeight;
                            hasBottomLeft = true;
                        }

                        if (col == colLen - 1) {
                            //右下三角 右下方形(rowLen-1-row)
                            bottomDistance = (rowLen - 1 - row) * halfTileHeight;
                            hasBottomRight = true;
                        }

                        // hasTopLeft = false;
                        // hasTopRight = false;
                        // hasBottomLeft = false;
                        // hasBottomRight = false;

                        let newImage = new jimp(tileWidth, topDistance + tileHeight + bottomDistance + gapY + 1);
                        let cutImgX = (rowLen - 1 - row + col) * halfTileWidth;             //完整图片中,当前图片所在的起点X
                        let cutImgY = topImageHigh + (row + col) * halfTileHeight;          //完整图片中,当前图片所在的起点Y

                        let startX = halfTileWidth;                                         //当前新创建图片菱形的开始X
                        let endX = halfTileWidth;                                           //当前新创建图片菱形的结束X
                        let startY = (row + col) * halfTileHeight - gapY;                   //当前新创建图片的开始Y
                        let endY = startY + tileHeight + gapY + 1;                          //当前新创建图片的结束Y
                        //所有图片都有的菱形区域
                        for (let y = startY; y <= endY; y++) {
                            for (let x = startX; x <= endX; x++) {
                                if (row == 0 && col == 0) {
                                    getSetPixel(originImage, newImage, cutImgX, cutImgY, x, y, startY, imageWidth, imageHeight, topDistance, gapY, true);
                                } else {
                                    getSetPixel(originImage, newImage, cutImgX, cutImgY, x, y, startY, imageWidth, imageHeight, topDistance, gapY);
                                }
                            }
                            if (y < halfTileHeight + startY) {
                                startX -= 2;
                                endX += 2;
                            }

                            if (y > halfTileHeight + startY) {
                                startX += 2;
                                endX -= 2;
                            }
                        }

                        //左上三角和方形
                        if (hasTopLeft) {
                            //左上三角
                            startX = 0;
                            endX = halfTileWidth;
                            for (let y = startY; y <= endY - halfTileHeight; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, cutImgX, cutImgY, x, y, startY, imageWidth, imageHeight, topDistance, gapY);
                                }

                                if (y <= halfTileHeight + startY) {
                                    endX -= 2;
                                }
                            }

                            //左上方形
                            startX = 0;
                            endX = halfTileWidth;
                            for (let y = -topImageHigh; y <= startY; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, cutImgX, cutImgY, x, y, startY, imageWidth, imageHeight, topDistance, gapY);
                                }
                            }
                        }

                        //右上三角和方形
                        if (hasTopRight) {
                            //右上三角
                            startX = halfTileWidth;
                            endX = tileWidth;
                            for (let y = startY; y <= endY - halfTileHeight; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, cutImgX, cutImgY, x, y, startY, imageWidth, imageHeight, topDistance, gapY);
                                }

                                if (y <= halfTileHeight + startY) {
                                    startX += 2;
                                }
                            }

                            //右上方形
                            startX = halfTileWidth;
                            endX = tileWidth;
                            for (let y = -topImageHigh; y <= startY; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, cutImgX, cutImgY, x, y, startY, imageWidth, imageHeight, topDistance, gapY);
                                }
                            }
                        }

                        //左下三角和方形
                        if (hasBottomLeft) {
                            //左下三角
                            startX = 0;
                            endX = 0;
                            for (let y = startY + halfTileHeight; y < endY + halfTileHeight; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, cutImgX, cutImgY, x, y, startY, imageWidth, imageHeight, topDistance, gapY);
                                }

                                if (y <= halfTileHeight + startY) {
                                    endX += 2;
                                }
                            }

                            //左下方形
                            startX = 0;
                            endX = halfTileWidth;
                            for (let y = endY + halfTileHeight; y <= imageHeight; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, cutImgX, cutImgY, x, y, startY, imageWidth, imageHeight, topDistance, gapY);
                                }
                            }
                        }

                        //右下三角和方形
                        if (hasBottomRight) {
                            //右下三角
                            startX = tileWidth;
                            endX = tileWidth;
                            for (let y = startY + halfTileHeight; y < endY + halfTileHeight; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, cutImgX, cutImgY, x, y, startY, imageWidth, imageHeight, topDistance, gapY);
                                }

                                if (y <= halfTileHeight + startY) {
                                    startX -= 2;
                                }
                            }

                            //右下方形
                            startX = halfTileWidth;
                            endX = tileWidth;
                            for (let y = endY + halfTileHeight; y <= imageHeight; y++) {
                                for (let x = startX; x <= endX; x++) {
                                    getSetPixel(originImage, newImage, cutImgX, cutImgY, x, y, startY, imageWidth, imageHeight, topDistance, gapY);
                                }
                            }
                        }

                        await newImage.write(output_path + "/" + texture + "_" + row + "_" + col + ".png");
                        needConsole = false;
                    }
                }
                resolve();
            }).catch(error => {
                global.snack(`裁剪纹理错误 id:${element.id}`, error);
                resolve();
            });
    });
}

function getSetPixel(originImage, newImage, cutImgX, cutImgY, x, y, startY, imageWidth, imageHeight, topDistance, gapY, canConsole) {
    let hex;
    let pixelX = cutImgX + x;
    let pixelY = cutImgY + y - startY;
    if (pixelX < 0 || pixelX > imageWidth || pixelY < 0 || pixelY > imageHeight) {
        hex = 0;
    } else {
        hex = originImage.getPixelColor(pixelX, pixelY);
    }

    if (canConsole) {
        // console.log(`-----------getPixelX:${pixelX}, getPixelY:${pixelY}`);
        // console.log(`-----------setPixelX:${x}, setPixelY:${y + topImageHigh + gapY}`);

        console.log(`-----------setPixelX:${x}, setPixelY:${y + topDistance - startY + gapY}`);
    }
    if (hex != 0) {
        // newImage.setPixelColor(hex, x, y + topImageHigh + gapY);
        newImage.setPixelColor(hex, x, y + topDistance - startY + gapY);
    }
}