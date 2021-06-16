import { Color } from "paper";
import { DataPoint } from "./dataPoint";

export class TreeNode {
    protected _point!: DataPoint | null;

    protected _path!: paper.PathItem | null;
    protected _childPaths!: Array<paper.PathItem>;
    protected _pathAsSvg!: string;

    protected _meanColor!: paper.Color;
    protected _meanLod!: number;
    protected _numberOfPoints!: number;
    protected _subpoints!: Set<DataPoint>;
    protected _level!: number;
    protected _maxLevel!: number;
    protected _minLevel!: number;
    protected _hasChanged!: boolean;

    public constructor(){
        this._meanLod = 0;
        this._meanColor = new Color(0,0,0);
        this._numberOfPoints = 1;
        this._path = null;
        this._hasChanged = false;
        this._subpoints = new Set<DataPoint>();
        this._childPaths = new Array<paper.PathItem>();
        this._level = 0;
        this._maxLevel = 0;
        this._minLevel = 0;
    }

    public get point(){
        return this._point;
    }

    public get lod(){
        return this._meanLod;
    }

    public get color(){
        return this._meanColor;
    }

    public get numberOfPoints(){
        return this._numberOfPoints;
    }

    public get path(){
        return this._path;
    }

    public get level(){
        return this._level;
    }

    public get maxLevel(){
        return this._maxLevel;
    }

    public get minLevel(){
        return this._minLevel;
    }

    public get depth(){
        // if(this.point != null)
        //     return (this.point as DataPoint).depth;
        
        let depth = 0;
        let amount = 0;
        this.subPoints.forEach((each: DataPoint) => {
            if(each != null){
                depth += each.depth;
                amount++;
            }
        });
        depth /= amount;
        return depth;
    }
    
    public get hasChanged(){
        return this._hasChanged;
    }

    public addSubpoint(point: DataPoint | null){
        if(point)
            this._subpoints.add(point);
    }

    public addChild(path: paper.PathItem){
        this._childPaths.push(path);
    }

    public get subPoints(){
        return this._subpoints;
    }

    public get childPaths(){
        return this._childPaths;
    }

    public clearSubPoints(){
        this._subpoints.clear();
    }

    public mergeSubPoints(newPoints: Set<DataPoint>){
        newPoints.forEach(this._subpoints.add, this._subpoints);
    }

    public get svg(){
        return this._pathAsSvg;
    }

    public set point(point: DataPoint | null){
        this._point = point;
    }

    public set level(level: number){
        this._level = level;
    }

    public set maxLevel(level: number){
        this._maxLevel = level;
    }

    public set minLevel(level: number){
        this._minLevel = level;
    }

    public set color(color: paper.Color){
        this._meanColor = color;
    }

    public set lod(value: number){
        this._meanLod = value;
    }

    public set numberOfPoints(value: number){
        this._numberOfPoints = value;
    }

    public set path(path: paper.PathItem | null){
        this._path = path;
        this._hasChanged = true;
    }

    public set hasChanged(changed: boolean){
        this._hasChanged = changed;
    }

    public set svg(svg: string){
        this._pathAsSvg = svg;
    }
}