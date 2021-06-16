import { Color } from "paper/dist/paper-core";
import { VPRenderer } from "../renderer/vpRenderer";
import { findMedianColor } from "../utils/colorUtil";
import { DataPoint } from "./dataPoint";

export enum ColorMode {
    MEDIAN,
    AVG,
    POINT
}
export abstract class Tree {

    protected _random!: () => number;
    protected _clipPath!: paper.Path;
    protected _colorMode!: ColorMode;

    abstract buildFrom(points: Array<DataPoint>, width: number, height: number, colorMode: ColorMode, renderer: VPRenderer): void;

    abstract traverse(node: any, nodes: Array<any>): void;

    public setupRand(renderer: VPRenderer){
        let rand = require('random-seed').create(renderer.seed);
        this._random = () => {return rand.floatBetween(0, 1)};
    }

    public allTreeNodes(node: any){
        let nodes = Array<any>();
        this.traverse(node, nodes)
        return nodes;
    }

    public abstract get root(): any;
       
    public getColor(node: any){
        switch(this._colorMode){
            case ColorMode.MEDIAN:
                return findMedianColor(node.subPoints);
            case ColorMode.POINT:
                if(node.point)
                    return node.point.color;
                //fallthrough if node.point == null
            case ColorMode.AVG:
                let color = new Color(0,0,0);
                let amount = 0;
                node.subPoints.forEach((each: DataPoint) => {
                    if(each){
                        color = color.add(each.color);
                        amount++;
                    }
                });
                color = color.divide(amount);
                return color;
        }
    }

    public get random(){
        return this._random;
    }

    public get clipPath(){
        return this._clipPath;
    }

    public get colorMode(){
        return this._colorMode;
    }

    public set colorMode(mode: ColorMode){
        this._colorMode = mode;
    }

    public set clipPath(path: paper.Path){
        this._clipPath = path;
    }
}
