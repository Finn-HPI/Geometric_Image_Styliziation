import { Vec2 } from "../vec2";
import { DataPoint } from "../dataPoint";
import { TreeNode } from "../node";

export class QuadNode extends TreeNode{
    protected _topLeft!: Vec2;
    protected _bottomRight!: Vec2;
    protected _filled!: boolean;

    protected _childTopLeft!: QuadNode | null;
    protected _childTopRight!: QuadNode | null;
    protected _childBottomLeft!: QuadNode | null;
    protected _childBottomRight!: QuadNode | null;

    public constructor(topLeft: Vec2, bottomRight: Vec2){
        super();
        this._topLeft = topLeft;
        this._bottomRight = bottomRight;
        this._childTopLeft = null;
        this._childTopRight = null;
        this._childBottomLeft = null;
        this._childBottomRight = null;

        this._filled = false;
    }

    public insert(point: DataPoint, root: QuadNode){
        if(point == null)
            return;

        if(!this.isInsideNode(point))
            return;

        if(!this.isFilled){
            this._point = point;
            this._filled = true;
            return;
        }

        if(this._filled && this.point !== null){
            let temp = this.point;
            this.point = null;
            root.insert(temp, root);
        }

        if(point.y <= (this._topLeft.y + this._bottomRight.y) / 2)
            if(point.x <= (this._topLeft.x + this._bottomRight.x) / 2){
                if(this._childTopLeft == null)
                    this._childTopLeft = new QuadNode(
                        this._topLeft,
                        new Vec2((this._topLeft.x + this._bottomRight.x) / 2,  (this._topLeft.y + this._bottomRight.y) / 2)
                    );
                this._childTopLeft.insert(point, root);
            }else{
                if(this._childTopRight == null)
                    this._childTopRight = new QuadNode(
                        new Vec2((this._topLeft.x + this._bottomRight.x) / 2, this._topLeft.y),
                        new Vec2(this._bottomRight.x, (this._topLeft.y + this._bottomRight.y)  /2)
                    );
                this._childTopRight.insert(point, root);
            }
        else
            if(point.x <= (this._topLeft.x + this._bottomRight.x) / 2){
                if(this._childBottomLeft == null)
                    this._childBottomLeft = new QuadNode(
                        new Vec2(this._topLeft.x, (this._topLeft.y + this._bottomRight.y) / 2),
                        new Vec2((this._topLeft.x + this._bottomRight.x) / 2, this._bottomRight.y)
                    );
                this._childBottomLeft.insert(point, root);
            }else{
                if(this._childBottomRight == null)
                    this._childBottomRight = new QuadNode(
                        new Vec2((this._topLeft.x + this._bottomRight.x) / 2, (this._topLeft.y + this._bottomRight.y) / 2),
                        this._bottomRight
                    );
                this._childBottomRight.insert(point, root);
            }
    }

    public search(point: DataPoint): DataPoint | null{
        if(!this.isInsideNode(point))
            return null;

        if(this._point != null)
            return this.point;

        if(point.y <= (this._topLeft.y + this._bottomRight.y) / 2)
            if(point.x <= (this._topLeft.x + this._bottomRight.x) / 2){
                if(this._childTopLeft == null)
                    return null;
                return this._childTopLeft.search(point);
            }else{
                if(this._childTopRight == null)
                   return null;
                return this._childTopRight.search(point);
            }
        else
            if(point.x <= (this._topLeft.x + this._bottomRight.x) / 2){
                if(this._childBottomLeft == null)
                    return null;
                return this._childBottomLeft.search(point);
            }else{
                if(this._childBottomRight == null)
                    return null;
                return this._childBottomRight.search(point);
            }
    }

    private isInsideNode(point: DataPoint): boolean{
        return (point.x >= this._topLeft.x && point.y >= this._topLeft.y &&
            point.x <= this._bottomRight.x && point.y <= this._bottomRight.y);
    }

    public get topLeft(){
        return this._topLeft;
    }

    public get bottomRight(){
        return this._bottomRight;
    }

    public get topLeftChild(){
        return this._childTopLeft;
    }

    public get topRightChild(){
        return this._childTopRight;
    }

    public get bottomLeftChild(){
        return this._childBottomLeft;
    }

    public get bottomRightChild(){
        return this._childBottomRight;
    }

    public get isFilled(){
        return this._filled;
    }
}