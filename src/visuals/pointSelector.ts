import { Color, Matrix, PaperScope, Path, Point } from "paper/dist/paper-core";
import { Layer } from "../renderer/layer";
import { DataPoint } from "../trees/dataPoint";
import { GrahamScan } from "../utils/graham";

export enum Mode {
    RECT,
    CUSTOM,
    HULL
}

export class PointSelector{
    
    protected _currentLayer!: Layer;

    protected _scope!: paper.PaperScope;
    protected _needsSetup!: boolean;
    protected _mousePressed!: boolean;
    protected _canvasSize!: [number, number];
    protected _mode!: Mode;
    protected _path!: paper.Path;
    protected _startPoint!: paper.Point;
    
    public constructor(canvasSize: [number, number]){
        this._scope = new PaperScope();
        this._scope.setup('clip-canvas');
        this._needsSetup = false;
        this._canvasSize = canvasSize;
        this._mousePressed = false;
        this._mode = Mode.RECT;
    }

    public clear(){
        this._scope.project.clear();
    }

    public mouseDown(point: paper.Point){
        if(this._currentLayer == undefined)
            return;
        this._scope.activate();
        this._mousePressed = true;
        this.checkForSetup();
        if(this._path !== undefined)
            this._path.remove();
        this._path = new Path();
        this._path.strokeColor = Color.random();
        this._path.strokeWidth = 2;
        
        this._path.add(point);
        this._startPoint = point;
    }

    public mouseUp(point: paper.Point){
        if(this._currentLayer == undefined)
            return;
        this._mousePressed = false;
        this.checkForSetup();
        switch(this._mode){
            case Mode.CUSTOM:
                this._path.add(point);
                this._path.closed = true;
                break;
        }
    }

    public applyClipPath(){
        let xScale = this._canvasSize[0] / this._scope.view.viewSize.width;
        let yScale = this._canvasSize[1]  /this._scope.view.viewSize.height;
        if(this._path !== undefined){
            this._path.transform(new Matrix(xScale, 0, 0, yScale, 0, 0))
            this._currentLayer.clipPath = this._path;
            this._currentLayer.clipPath.fillColor = new Color(0,0,0);
        }
    }

    public generateConvexHull(){

        this._scope.setup('clip-canvas');
        this._scope.activate();
        let xScale = this._scope.view.viewSize.width / this._canvasSize[0];
        let yScale = this._scope.view.viewSize.height / this._canvasSize[1];

        let hullGen = new GrahamScan();
        hullGen.points = this._currentLayer.points;
        let hull = hullGen.getHull();

        if(this._path !== undefined)
            this._path.remove();
        this._path = new Path();
        this._path.strokeColor = Color.random();
        this._path.strokeWidth = 2;

        hull.forEach((point: DataPoint) => {
            this._path.add(new Point(point.x * xScale, point.y * yScale));
        });

        this._path.closed = true;
    }

    public mouseMove(point: paper.Point){
        this.checkForSetup();
        if(this._path.lastSegment.point.getDistance(point) > 5)
            switch(this._mode){
                case Mode.CUSTOM: this._path.add(point);
                    break;
                case Mode.RECT:
                    this._path.remove();
                    let color = this._path.strokeColor;
                    this._path = new Path.Rectangle(this._startPoint, point);
                    this._path.strokeColor = color;
                    this._path.strokeWidth = 2;
                    break;
            }
        
    }

    private checkForSetup(){
        if(this._needsSetup){
            this._scope.setup('clip-canvas');
            this._needsSetup = false;
        }
    }

    public get mousePressed(){
        return this._mousePressed;
    }

    public get mode(){
        return this._mode;
    }

    public set mode(mode: Mode){
        this._mode = mode;
    }

    public get currentLayer(){
        return this._currentLayer;
    }

    public set currentLayer(layer: Layer){
        this._currentLayer = layer;
    }

    public needsSetup(needed: boolean = true){
        this._needsSetup = needed;
    }

    public deactivate(){
        this.clear();
        this._scope = new PaperScope();
    }
}