import { Color } from "paper";
import { DataPoint } from "../trees/dataPoint";
import { colorArrayToColor, colorToColorArray, findBestColorIn } from "./colorUtil";

export function generateDataFrom(
    colorData: Uint8Array,
    samples: Uint8Array, 
    lodData: Uint8Array, 
    depthData: Uint8Array,
    mattingData: Uint8Array,
    saliencyAData: Uint8Array,
    saliencyOData: Uint8Array,
    segmentationData: Uint8Array,
    maskData: Uint8ClampedArray,
    width: number, 
    height: number,
    maxColorCount: number = 0,
): Array<DataPoint>{

    let points: Array<DataPoint> = [];
    let arrayOfColors = [];
    console.log('generate points');
    let r,g,b = 0;
    for(let x = 0; x < width; x++)
        for(let y = 0; y < height; y++){
            const index = (y * width + x) * 4;
            r = colorData[index] / 255;
            g = colorData[index + 1] / 255;
            b = colorData[index + 2] / 255;
            if(samples[index + 3] > 0){
                const flippedIndex = ((height -1 - y) * width + x) * 4;
                let mask_alpha = maskData[flippedIndex + 3] / 255;
                let lod = lodData[index] * (1-mask_alpha) + maskData[flippedIndex] * mask_alpha;

                let d = depthData[index];
                let m = mattingData[index];
                let sa = saliencyAData[index];
                let so = saliencyOData[index];
                let seg: [number, number, number] = [segmentationData[index], segmentationData[index+1], segmentationData[index+2]];

                let p = new DataPoint(x, height - y, lod, new Color(r, g, b), d, m, sa, so, seg);
                arrayOfColors.push([r * 255, g * 255, b * 255]);
                points.push(p);
            }
        }

    
    let quantize = require('quantize');
    let colorMap = quantize(arrayOfColors, maxColorCount);
    if(colorMap !== false)
        points.forEach((each: DataPoint) => {
            each.quantizisedColor = colorArrayToColor(colorMap.map(colorToColorArray(each.color)));
        });
    else{
        points.forEach((each: DataPoint) => {
            each.quantizisedColor = each.color;
        });
    }
    
    return points;
}