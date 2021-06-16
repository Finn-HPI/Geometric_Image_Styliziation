import 
{
    Path,
    PaperScope,
    Color
} from 'paper';

export enum BrushMode{
    ADD = 1,
    REMOVE = 0
}
export class BrushTool{

    protected _scope!: paper.PaperScope;
    protected _radius!: number;
    protected _alpha!: number;
    protected _mode!: BrushMode;

    protected _needsSetup!: boolean;

    protected _lastPoint!: paper.Point;
    protected _path!: paper.Path;

    protected _tool!: paper.Tool;

    protected _mousePressed!: boolean;

    public constructor(){
        this._scope = new PaperScope();
        this._scope.setup('mask-canvas');
        this._needsSetup = false;
        this._mode = BrushMode.ADD;
        this._radius = 10;
        this._alpha = 0.5;
        this._mousePressed = false;
    }

    public clear(){
        this._scope.project.clear();
    }

    public mouseDown(position: paper.Point){
        this.checkForSetup();
        this._scope.activate();
        this._mousePressed = true;
        this._path = new Path();
        this._path.fillColor = new Color(this._mode, this._mode, this._mode, this._alpha);
        this._path.add(position);
        this._lastPoint = position;
    }

    public mouseUp(position: paper.Point){
        this.checkForSetup();
        if(!this._mousePressed) return;
        this._mousePressed = false;
        this._path.add(position);
        this._path.closed = true;
        this._path.smooth();
    }

    public mouseMove(position: paper.Point){
        this.checkForSetup();

        let step = position.subtract(this._lastPoint).divide(2);
        if(step.length <= 2)
            return
        step.angle += 90;
        step = step.normalize(this._radius);
        let top = position.add(step);
        let bootom = position.subtract(step);
        this._path.add(top);
        this._path.insert(0, bootom);
        this._path.smooth();
        this._lastPoint = position;
    }

    private checkForSetup(){
        if(this._needsSetup){
            this._scope.setup('mask-canvas');
            this._needsSetup = false;
        }
    }

    public set radius(radius: number){
        this._radius = radius;
    }

    public set alpha(alpha: number){
        this._alpha = alpha;
    }

    public set mode(mode: BrushMode){
        this._mode = mode;
    }

    public get isMousePressed(){
        return this._mousePressed;
    }

    public set mousePressed(pressed: boolean){
        this._mousePressed = pressed;
    }

    public needsSetup(needed: boolean = true){
        this._needsSetup = needed;
    }
}