import { PaperScope, Path, Point, Color, Size } from "paper/dist/paper-core";
import { Layer } from "../renderer/layer";
import { DataPoint } from "../trees/dataPoint";

export class PointViwer{

    protected _scope!: paper.PaperScope;
    protected _needsSetup!: boolean;
    protected _canvasSize!: [number, number];
    
    public constructor(canvasSize: [number, number]){
        this._scope = new PaperScope();
        this._scope.setup('point-canvas');
        this._needsSetup = false;
        this._canvasSize = canvasSize;
    }

    public showPoints(layer: Layer){
        this.checkForSetup();
        this._scope.activate();
        this.clear();

        let xScale = this._scope.view.viewSize.width / this._canvasSize[0];
        let yScale = this._scope.view.viewSize.height / this._canvasSize[1];

        layer.points.forEach((each: DataPoint) => {
            let point = new Path.Circle(new Point(each.x* xScale, each.y * yScale), 1);
            point.fillColor = each.quantizisedColor;
        });
    }

    public clear(){
        this._scope.project.clear();
    }

    private checkForSetup(){
        if(this._needsSetup){
            this._scope.setup('point-canvas');
            this._scope.activate();
            this._needsSetup = false;
        }
    }

    public needsSetup(needed: boolean = true){
        this._needsSetup = needed;
    }

    public deactivate(){
        this._scope.setup(new Size(this._canvasSize[0], this._canvasSize[1]));
    }
}