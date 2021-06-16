import { DataPoint } from "../dataPoint";
import { TreeNode } from "../node";

export class KdNode extends TreeNode{

    protected _left!: KdNode | null;
    protected _right!: KdNode | null;

    protected _xAligned!: boolean;

    public constructor(point: DataPoint | null = null){
        super();
        this._point = point;
        this._left = null;
        this._right = null;
        this._xAligned = true;
    }

    public get left(){
        return this._left;
    }

    public get right(){
        return this._right;
    }

    public get isXAligned(){
        return this._xAligned;
    }

    public set left(left: KdNode | null){
        this._left = left;
    }

    public set right(right: KdNode | null){
        this._right = right;
    }

    public set xAligned(x: boolean){
        this._xAligned = x;
    }
}