export class DataPoint {
    protected _x!: number;
    protected _y!: number;
    protected _color!: paper.Color; 
    protected _quantizisedColor!: paper.Color;
    protected _lod!: number;

    protected _depth!: number;
    protected _matting!: number;
    protected _saliencyA!: number;
    protected _saliencyO!: number;
    protected _segment!: [number, number, number];

    public constructor(
        x: number, 
        y:number, 
        lod: number, 
        color: paper.Color,
        depth: number, 
        matting: number, 
        saliencyA: number, 
        saliencyO: number, 
        segment: [number, number, number]
    ){
        this._x = x;
        this._y = y;
        this._lod = lod;
        this._color = color;

        this._depth = depth;
        this._matting = matting;
        this._saliencyA = saliencyA;
        this._saliencyO = saliencyO;
        this._segment = segment;
    }

    public dist(data: DataPoint): number{
        return Math.sqrt(
            (this._x - data.x) * (this._x - data.x) + 
            (this._y - data.y) * (this._y - data.y)
        );
    }

    public distToPoint(x: number, y: number): number{
        return Math.sqrt(
            (this._x - x) * (this._x - x) + 
            (this._y - y) * (this._y - y)
        );
    }

    public get x(){
        return this._x;
    }

    public get y(){
        return  this._y;
    }

    public get color(){
        return this._color;
    }

    public get quantizisedColor(){
        return this._quantizisedColor;
    }

    public get lod(){
        return this._lod;
    }

    public get depth(){
        return this._depth;
    }

    public get matting(){
        return this._matting;
    }

    public get saliencyA(){
        return this._saliencyA;
    }

    public get saliencyO(){
        return this._saliencyO;
    }

    public get segment(){
        return this._segment;
    }

    public set x(x: number){
        this._x = x;
    }

    public set y(y: number){
        this._y = y;
    }

    public set color(color: paper.Color){
        this._color = color;
    }

    public set quantizisedColor(color: paper.Color){
        this._quantizisedColor = color;
    }

    public set lod(lod: number){
        this._lod = lod;
    }
}