import { DataPoint } from "../trees/dataPoint";

export class GrahamScan {

    protected _points!: DataPoint[];

    public constructor(){
        this._points = [];
    }

    public clear(){
        this._points = [];
    }

    public get points(){
        return this._points;
    }

    public set points(points: DataPoint[]){
        this._points = points.slice();
    }

    public addPoint(point: DataPoint){
        this._points.push(point);
    }

    public getHull(){
        const pivot = this.preparePivotPoint();

        let indexes = Array.from(this._points, (point, i) => i);
        const angles = Array.from(this._points, (point) => this.getAngle(pivot, point));
        const distances = Array.from(this._points, (point) => this.euclideanDistanceSquared(pivot, point));

        indexes.sort((i, j) => {
            const angleA = angles[i];
            const angleB = angles[j];
            if (angleA === angleB) {
                const distanceA = distances[i];
                const distanceB = distances[j];
                return distanceA - distanceB;
            }
            return angleA - angleB;
        });

        for (let i = 1; i < indexes.length - 1; i++) {
            if (angles[indexes[i]] === angles[indexes[i + 1]]) {
                indexes[i] = -1;
            }
        }

        const hull = [];
        for (let i = 0; i < indexes.length; i++) {
            const index = indexes[i];
            const point = this._points[index];

            if (index !== -1) {
                if (hull.length < 3) {
                    hull.push(point);
                } else {
                    while (this.checkOrientation(hull[hull.length - 2], hull[hull.length - 1], point) > 0) {
                        hull.pop();
                    }
                    hull.push(point);
                }
            }
        }

        return hull.length < 3 ? [] : hull;
    }

    private checkOrientation(p1: DataPoint, p2: DataPoint, p3: DataPoint){
        return (p2.y - p1.y) * (p3.x - p2.x) - (p3.y - p2.y) * (p2.x - p1.x);
    }

    private getAngle(a: DataPoint, b: DataPoint){
        return Math.atan2(b.y - a.y, b.x - a.x);
    }

    private euclideanDistanceSquared(p1: DataPoint, p2: DataPoint){
        const a = p2.x - p1.x;
        const b = p2.y - p1.y;
        return a * a + b * b;
    }

    private preparePivotPoint(){
        let pivot = this._points[0];
        let pivotIndex = 0;
        for (let i = 1; i < this._points.length; i++) {
            const point = this._points[i];
            if (point.y < pivot.y || point.y === pivot.y && point.x < pivot.x) {
                pivot = point;
                pivotIndex = i;
            }
        }
        return pivot;
    }    
}