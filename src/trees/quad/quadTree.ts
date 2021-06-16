import { Color } from "paper";
import { DataPoint } from "../dataPoint";
import { QuadNode } from "./quadNode";
import { Vec2 } from "../vec2";
import { ColorMode, Tree } from "../tree";
import { VPRenderer } from "../../renderer/vpRenderer";
import { findMedianColor } from "../../utils/colorUtil";
export class QuadTree extends Tree{

    protected _root!: QuadNode;
    protected _width!: number;
    protected _height!: number;

    public buildFrom(points: Array<DataPoint>, width: number, height: number, colorMode: ColorMode, renderer: VPRenderer){
        this.setupRand(renderer);
        this._colorMode = colorMode;

        this._root = new QuadNode(new Vec2(0,0), new Vec2(width, height));
        this._width = width;
        this._height = height;

        points.forEach((point: DataPoint) => {
            this._root.insert(point, this._root);
        });

        if(this._root){
            this.gatherSubPoints(this._root);
            this.meanData(this._root);
        }
    }

    public meanData(node: QuadNode): void{
        if(node == null)
            return;
        
        if(node.topLeftChild !== null)
            this.meanData(node.topLeftChild);
        if(node.topRightChild !== null)
            this.meanData(node.topRightChild);
        if(node.bottomLeftChild !== null)
            this.meanData(node.bottomLeftChild);
        if(node.bottomRightChild !== null)
            this.meanData(node.bottomRightChild);

        node.numberOfPoints += (node.topLeftChild !== null? node.topLeftChild.numberOfPoints : 0)
            + (node.topRightChild !== null? node.topRightChild.numberOfPoints : 0)
            + (node.bottomLeftChild !== null? node.bottomLeftChild.numberOfPoints : 0)
            + (node.bottomRightChild !== null? node.bottomRightChild.numberOfPoints : 0);

        let total = 1;
        node.lod = node.point !== null? node.point.lod : 0;
        if(node.topLeftChild !== null){
            node.lod += node.topLeftChild.lod * node.topLeftChild.numberOfPoints;
            total += node.topLeftChild.numberOfPoints;
        }
        if(node.topRightChild !== null){
            node.lod += node.topRightChild.lod * node.topRightChild.numberOfPoints;
            total += node.topRightChild.numberOfPoints;
        }
        if(node.bottomLeftChild !== null){
            node.lod += node.bottomLeftChild.lod * node.bottomLeftChild.numberOfPoints;
            total += node.bottomLeftChild.numberOfPoints;
        }
        if(node.bottomRightChild !== null){
            node.lod += node.bottomRightChild.lod * node.bottomRightChild.numberOfPoints;
            total += node.bottomRightChild.numberOfPoints;
        }
        node.lod /= total;
        node.color = this.getColor(node);
       
    }

    public gatherSubPoints(node: QuadNode){
        if(node == null)
            return;
        if(node.topLeftChild !== null)
            this.gatherSubPoints(node.topLeftChild);
        if(node.topRightChild !== null)
            this.gatherSubPoints(node.topRightChild);
        if(node.bottomLeftChild !== null)
            this.gatherSubPoints(node.bottomLeftChild);
        if(node.bottomRightChild !== null)
            this.gatherSubPoints(node.bottomRightChild);
        
        node.addSubpoint(node.point);
        if(node.topLeftChild !== null)
            node.mergeSubPoints(node.topLeftChild.subPoints);
        if(node.topRightChild !== null)
            node.mergeSubPoints(node.topRightChild.subPoints);
        if(node.bottomLeftChild !== null)
            node.mergeSubPoints(node.bottomLeftChild.subPoints);
        if(node.bottomRightChild !== null)
            node.mergeSubPoints(node.bottomRightChild.subPoints);
    }

    public traverse(node: QuadNode, nodes: Array<QuadNode>){
        if(node == null)
            return;

        if(node.path)
            nodes.push(node);
        
        if(node.topLeftChild !== null)
            this.traverse(node.topLeftChild, nodes);
        if(node.topRightChild !== null)
            this.traverse(node.topRightChild, nodes);
        if(node.bottomLeftChild !== null)
            this.traverse(node.bottomLeftChild, nodes);
        if(node.bottomRightChild !== null)
            this.traverse(node.bottomRightChild, nodes);
    }

    public get width(){
        return this._width;
    }

    public get height(){
        return this._height;
    }

    public get root(){
        return this._root;
    }
}