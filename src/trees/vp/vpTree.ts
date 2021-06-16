import { DataPoint } from '../dataPoint';
import { VPNode } from './vpNode';
import { Color } from 'paper'; 
import FastPriorityQueue from 'fastpriorityqueue';
import { select } from '../../utils/vpUtil';
import { ColorMode, Tree } from '../tree';
import { VPRenderer } from '../../renderer/vpRenderer';
import { findMedianColor } from '../../utils/colorUtil';

export class VPTree extends Tree{

    protected _root!: VPNode | null;
    protected _maxDist!: number;
    protected _clipPath!: paper.Path;

    private buildTree(data: DataPoint[]){
        this._root = this.recursiveBuild(data);
    }

    private randIndex(arr: DataPoint[]){
        return Math.floor(this.random() * arr.length);
    }

    public buildFrom(points: Array<DataPoint>, width: number, height: number, colorMode: ColorMode, renderer: VPRenderer){
        this.setupRand(renderer);
        this._colorMode = colorMode;

        this.buildTree(points);
        if(this._root){
            this.gatherSubPoints(this._root);
            this.meanData(this._root);
        }
    }

    public gatherSubPoints(node: VPNode){
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

    public meanData(node: VPNode): void{
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

        node.color = this.getColor(node);
        
        if(node.left == null && node.right == null && node.point){
            node.lod = node.point.lod;
        }
    }

    private recursiveBuild(data: DataPoint[]): VPNode | null{
        if(data.length == 0)
            return null;

        let vp: DataPoint = data.splice(this.randIndex(data), 1)[0];
        let node = new VPNode();
        node.point = vp;

        let distances = [];
        for(let i = 0; i < data.length; i++){
            let dist = vp.dist(data[i]);
            distances[i] = dist;
        }

        let mu = select(distances, Math.floor(distances.length / 2));
        let leftList = [];
        let rightList = [];
        
        for(let i = 0; i < data.length; i++)
            if(vp.dist(data[i]) < mu)
                leftList.push(data[i]);
            else
                rightList.push(data[i]);

        node.threshold = mu;
        node.left = this.recursiveBuild(leftList);
        node.right = this.recursiveBuild(rightList);

        if(node.left !== null){
            node.left.parent = node;
            node.left.isLeftChild = true;
        }
        if(node.right !== null){
            node.right.parent = node;
            node.right.isLeftChild = false;
        }
        return node;
    }

    public traverse(node: VPNode, nodes: Array<VPNode>){
        if(node == null || node.path == null)
            return;
        nodes.push(node);
        
        if(node.left !== null)
            this.traverse(node.left, nodes);
        if(node.right !== null)
            this.traverse(node.right, nodes);
    }

    public findKnn(target: paper.Point, k: number): VPNode[]{
        let queue = new FastPriorityQueue(function(a: VPNode, b: VPNode) {
            return (b.point as DataPoint).distToPoint(target.x, target.y) <=  (a.point as DataPoint).distToPoint(target.x, target.y)
        });
        this._maxDist = Number.MAX_VALUE;
        if(this._root == null)
            return [];

        this.search(this._root, target, k, queue);
        return queue.kSmallest(k);
    }

    private search(node: VPNode, target: paper.Point, k: number, queue: FastPriorityQueue<VPNode>){
        if(node == null || !node.point)
            return;
        let dist = node.point.distToPoint(target.x, target.y);
        if(dist < this._maxDist){
            if(queue.size == k)
                queue.poll();
            queue.add(node);
            if(queue.size == k)
                this._maxDist = ((queue.peek() as VPNode).point as DataPoint).distToPoint(target.x, target.y);
        }
        if(node.left == null && node.right == null)
            return;

        if(dist < node.threshold){
            if(dist - this._maxDist <= node.threshold && node.left)
                this.search(node.left, target, k, queue);
            if(dist + this._maxDist >= node.threshold && node.right)
                this.search(node.right, target, k, queue);
        }else{
            if(dist + this._maxDist >= node.threshold && node.right)
                this.search(node.right, target, k, queue);
            if(dist - this._maxDist <= node.threshold && node.left)
                this.search(node.left, target, k, queue);
        }
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