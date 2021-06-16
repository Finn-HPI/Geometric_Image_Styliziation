import { DataPoint } from "../trees/dataPoint";
import { DataStructure } from "../visuals/svgBuilder";

export class Layer{

    protected _tree!: DataStructure;
    protected _treeS!: string;
    protected _points!: DataPoint[];
    protected _preRemainingPoints!: DataPoint[];
    protected _remainingPoints!: DataPoint[];
    protected _maxLevel!: number;

    protected _from!: number;
    protected _to!: number;

    protected _criteria!: number;
    protected _criteriaS!: string;

    protected _color!: number;
    protected _colorS!: string;

    protected _maxLod!: number;
    protected _clipPath!: paper.Path;

    protected _keep!: boolean;

    public constructor(tree: DataStructure, criteria: number, color: number, treeS: string, criteriaS: string, colorS: string, from: number, to: number, remainingPoints: DataPoint[], canvasSize: [number, number], keep: boolean){
        this._tree = tree;
        this._preRemainingPoints = remainingPoints;
        this._points = [];
        this._remainingPoints = [];
        this._maxLod = 0;
        this._from = from;
        this._to = to;
        this._criteria = criteria;
        this._criteriaS = criteriaS;
        this._color = color;
        this._colorS = colorS;
        this._keep = keep;
        this.gatherPointsFor(criteria, from, to);
        this._treeS = treeS;
        this._maxLevel = 15;
    }

    private gatherPointsFor(criteria: number, from: number, to: number){
        this._preRemainingPoints.forEach((each: DataPoint) => {
            if(this.isValidPoint(each, criteria, from, to)){
                this._points.push(each);
                if(this._keep)
                    this._remainingPoints.push(each);
                if(each.lod > this._maxLod)
                    this._maxLod = each.lod;
            }
            else
                this._remainingPoints.push(each);
        });
    }

    private isValidPoint(point: DataPoint, criteria: number, from: number, to: number): boolean{
        switch(criteria){
            case 0: return from <= point.lod && to >= point.lod;
            case 1: return from <= point.depth && to >= point.depth;
            case 2: return from <= point.matting && to >= point.matting;
            case 3: return from <= point.saliencyA && to >= point.saliencyA;
            case 4: return from <= point.saliencyO && to >= point.saliencyO;
        }
        return false;
    }

    public get points(){
        return this._points;
    }

    public get remainingPoints(){
        return this._remainingPoints;
    }

    public get preRemainingPoints(){
        return this._preRemainingPoints;
    }

    public get tree(){
        return this._tree;
    }

    public get maxLod(){
        return this._maxLod;
    }

    public get clipPath(){
        return this._clipPath;
    }

    public get from(){
        return this._from;
    }

    public get to(){
        return this._to;
    }

    public get criteria(){
        return this._criteria;
    }

    public get color(){
        return this._color;
    }

    public get keep(){
        return this._keep;
    }

    public get criteriaAsString(){
        return this._criteriaS;
    }

    public get colorAsString(){
        return this._colorS;
    }

    public get treeAsString(){
        return this._treeS;
    }

    public get maxLevel(){
        return this._maxLevel;
    }

    public set clipPath(path: paper.Path){
        this._clipPath = path;
    }

    public set maxLevel(level: number){
        this._maxLevel = level;
    }
}