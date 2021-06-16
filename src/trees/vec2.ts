export class Vec2 {

    protected _x!: number;
    protected _y!: number;

    public constructor(x: number, y: number){
        this._x = x;
        this._y = y;
    }

    public get x(){
        return this._x;
    }

    public get y(){
        return this._y;
    }

    public set x(x: number){
        this._x = x;
    }

    public set y(y: number){
        this._y = y;
    }
}