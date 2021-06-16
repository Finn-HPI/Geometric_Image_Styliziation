import { Color } from "paper/dist/paper-core";
import { VPRenderer } from "../../renderer/vpRenderer";
import { DataPoint } from "../dataPoint";
import { ColorMode, Tree } from "../tree";
import { KdNode } from "./kdNode";

export class KdTree extends Tree{

    protected _root!: KdNode | null;

    public buildFrom(points: Array<DataPoint>, width: number, height: number, colorMode: ColorMode, renderer: VPRenderer){
        this.setupRand(renderer);
        this._colorMode = colorMode;

        points = points.sort((a, b) => 0.5 - this.random());
        let startPoint = points[Math.floor(points.length / 2)];
        this._root = this.insert(this._root, startPoint);

        points.forEach((point: DataPoint) => {
            if(point !== startPoint)
                this._root = this.insert(this._root, point);
        });

        if(this._root){
            this.gatherSubPoints(this._root);
            this.meanData(this._root);
        }
    }

    public insert(root: KdNode | null, point: DataPoint, level: number = 0): KdNode | null{
        if(root == null)
            return new KdNode(point);

        let data = [point.x, point.y, (root.point as DataPoint).x, (root.point as DataPoint).y];

        if(data[level % 2] <= data[(level % 2) + 2])
            root.left = this.insert(root.left, point, level + 1);
        else
            root.right = this.insert(root.right, point, level + 1);
        return root;
    }

    public gatherSubPoints(node: KdNode){
        if(node == null)
            return;
        if(node.left !== null)
            this.gatherSubPoints(node.left);
        if(node.right !== null)
            this.gatherSubPoints(node.right);
        
        node.addSubpoint(node.point);
        if(node.left !== null)
            node.mergeSubPoints(node.left.subPoints);
        if(node.right !== null)
            node.mergeSubPoints(node.right.subPoints);
    }

    public meanData(node: KdNode): void{
        if(node == null)
            return;

        if(node.left !== null)
            this.meanData(node.left);
        if(node.right !== null)
            this.meanData(node.right);

        node.numberOfPoints += (node.left !== null? node.left.numberOfPoints : 0)
            + (node.right !== null? node.right.numberOfPoints : 0); 
            
        node.lod = ((node.left !== null? node.left.lod : 0)
            + (node.right !== null? node.right.lod : 0)) / 2; 

        let total = 1;
        node.lod = node.point !== null? node.point.lod : 0;
        if(node.left !== null){
            node.lod += node.left.lod * node.left.numberOfPoints;
            total += node.left.numberOfPoints;
        }
        if(node.right !== null){
            node.lod += node.right.lod * node.right.numberOfPoints;
            total += node.right.numberOfPoints;
        }
        
        node.lod /= total;
        node.color = this.getColor(node);
    }

    public traverse(node: KdNode, nodes: Array<KdNode>){
        if(node == null)
            return;
        nodes.push(node);
        if(node.left !== null)
            this.traverse(node.left, nodes);
        if(node.right !== null)
            this.traverse(node.right, nodes);
    }

    public get root(){
        return this._root;
    }

    public get clipPath(){
        return this._clipPath;
    }

    public set clipPath(path: paper.Path){
        this._clipPath = path;
    }
}