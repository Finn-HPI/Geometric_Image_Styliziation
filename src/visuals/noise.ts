import 
{
    PaperScope
} from 'paper';
import { Color, Path, Point } from 'paper/dist/paper-core';
import Vec2 from 'vec2';

export enum NoiseMode{
    SIMPLE,
    BLUE_NOISE
}
export class NoiseTool{

    protected _scope!: paper.PaperScope;
    protected _mode!: NoiseMode;

    protected _needsSetup!: boolean;
    protected _mousePressed!: boolean;

    protected _canvasSize!: [number, number];

    public constructor(canvasSize: [number, number]){
        this._scope = new PaperScope();
        this._scope.setup('point-canvas');
        this._needsSetup = false;
        this._mode = NoiseMode.SIMPLE;
        this._mousePressed = false;
        this._canvasSize = canvasSize;
    }

    public clear(){
        this._scope.project.clear();
    }

    public showSampling(points: Array<Vec2>, width: number, height: number){

        let xScale = this._scope.view.viewSize.width / this._canvasSize[0];
        let yScale = this._scope.view.viewSize.height / this._canvasSize[1];

        this.checkForSetup();
        let back = new Path.Rectangle(new Point(0,0), new Point(width, height));
        back.fillColor = new Color(1,1,1);
        points.forEach((each: Vec2) => {
            let point = new Path.Circle(new Point(Math.floor(each.x) * xScale, Math.floor(each.y) * yScale), 1);
            point.fillColor = new Color(0,0,0);
        });
    }

    private checkForSetup(){
        if(this._needsSetup){
            this._scope.setup('point-canvas');
            this._needsSetup = false;
        }
    }

    public set mode(mode: NoiseMode){
        this._mode = mode;
    }

    public needsSetup(needed: boolean = true){
        this._needsSetup = needed;
    }
}