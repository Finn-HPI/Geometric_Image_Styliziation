import { Color } from "paper/dist/paper-core";
import { DataPoint } from "../trees/dataPoint";

export function dataArrayToUint8ColorArray(data: Set<DataPoint>){
    let ret = new Uint8ClampedArray(3 * data.size);
    let index = 0;
    data.forEach((each: DataPoint) => {
        ret[index + 0] = each.color.red * 255;
        ret[index + 1] = each.color.green * 255;
        ret[index + 2] = each.color.blue * 255;
        index += 3;
    });
    return ret;
}

export function dataArrayToNumberColorArray(data: Set<DataPoint>){
    let ret = Array<[number, number, number]>();
    data.forEach((each: DataPoint) => {
        ret.push([each.color.red * 255, each.color.green * 255, each.color.blue * 255]);
    });
    return ret;
}

export function colorArrayToColor(color: [number, number, number]){
    return new Color(color[0] / 255, color[1] / 255, color[2] / 255);
}

export function colorToColorArray(color: paper.Color){
    return [color.red * 255, color.green * 255, color.blue * 255];
}

export function findBestColorIn(colorPalette: Array<[number, number, number]>, color: paper.Color){
    let col = [color.red * 255, color.green * 255, color.blue * 255];
    let original = col.slice(0,4);
    let minDist = Number.MAX_VALUE;
    colorPalette.forEach((each) => {
        let dist = (original[0] - each[0]) * (original[0] - each[0]) 
            + (original[1] - each[1]) * (original[1] - each[1])
            + (original[2] - each[2]) * (original[2] - each[2]);
        if(dist < minDist){
            minDist = dist;
            col = each;
        }
    });
    
    return new Color(col[0] / 255, col[1] / 255, col[2] / 255);
}

export function componentToHex(c: number) {
    let hex = (c * 255).toString(16).slice(0,2);
    return hex.length == 1 ? "0" + hex : hex;
}
  
export function colorToHex(color: paper.Color) {
    return "#" + componentToHex(color.red) + componentToHex(color.green) + componentToHex(color.blue);
}

export function getColorFromHex(color: string){
    let split = RegExp(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i).exec(color);
        if(split != null)
            return new Color(
                parseInt(split[1], 16) / 255,
                parseInt(split[2], 16) / 255,
                parseInt(split[3], 16) / 255,
                1
            );
    return new Color(0,0,0);
}

export function colorToGrayScale(color: paper.Color){
    let l = color.red * 0.3 + color.green * 0.59 + color.blue * 0.11; 
    return new Color(l, l, l);
}

export function findMedianColor(points: Set<DataPoint>){
    let rRange = [-1,-1];
    let gRange = [-1,-1];
    let bRange = [-1,-1];

    points.forEach((each: DataPoint) => {
        const color = each.quantizisedColor;
        rRange[0] = (rRange[0] == -1 || rRange[0] > color.red)? color.red : rRange[0];
        rRange[1] = (rRange[1] == -1 || rRange[1] < color.red)? color.red : rRange[1];

        gRange[0] = (gRange[0] == -1 || gRange[0] > color.green)? color.green : gRange[0];
        gRange[1] = (gRange[1] == -1 || gRange[1] < color.green)? color.green : gRange[1];

        bRange[0] = (bRange[0] == -1 || bRange[0] > color.blue)? color.blue : bRange[0];
        bRange[1] = (bRange[1] == -1 || bRange[1] < color.blue)? color.blue : bRange[1];
    });

    let rDist = rRange[1] - rRange[0];
    let gDist = gRange[1] - gRange[0];
    let bDist = bRange[1] - bRange[0];

    let rCompare = (a: DataPoint, b: DataPoint) => {
        return a.quantizisedColor.red - b.quantizisedColor.red;
    };
    let gCompare = (a: DataPoint, b: DataPoint) => {
        return a.quantizisedColor.green - b.quantizisedColor.green;
    };
    let bCompare = (a: DataPoint, b: DataPoint) => {
        return a.quantizisedColor.blue - b.quantizisedColor.blue;
    };

    let compareFunc = rCompare;

    if(gDist >= rDist && gDist >= bDist)
        compareFunc = gCompare;
    if(bDist >= rDist && bDist >= gDist)
        compareFunc = bCompare;

    let sorted = Array.from(points).sort(compareFunc);
    
    return sorted[Math.floor(sorted.length / 2)].quantizisedColor;
}
