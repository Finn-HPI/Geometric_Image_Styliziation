import { TreeNode } from "../node";

export class VPNode extends TreeNode{
    protected _threshold!: number;
   
    protected _parent!: VPNode | null;
    protected _isLeftChild!: boolean;
    protected _left!: VPNode | null;
    protected _right!: VPNode | null;

    public constructor(){
        super();
        this._threshold = 0;
        this._parent = null;
    }

    public get left(){
        return this._left;
    }

    public get right(){
        return this._right;
    }

    public get threshold(){
        return this._threshold;
    }

    public get parent(){
        return this._parent;
    }

    public get isLeftChild(){
        return this._isLeftChild;
    }

    public set threshold(threshold: number){
        this._threshold = threshold;
    }

    public set left(left: VPNode | null){
        this._left = left;
    }

    public set right(right: VPNode | null){
        this._right = right;
    }

    public set parent(parent: VPNode | null){
        this._parent = parent;
    }

    public set isLeftChild(left: boolean){
        this._isLeftChild = left;
    }
}
