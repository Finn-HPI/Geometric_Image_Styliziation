import { VPRenderer } from "../renderer/vpRenderer";

/*
Taken from (slight modifications):
https://github.com/kchapelier/fast-2d-poisson-disk-sampling
*/

export class BlueNoise{
    protected _xMin = 0;
    protected _xMax = 0;
    protected _yMin = 0;
    protected _yMax = 0;
    protected _radius = 1;
    protected _k = 30;
    protected _pointQueue = Array<any>();
    protected random!: () => number;
    protected _firstPoint = true;

    protected _grid = {
        width: 0,
        height: 0,
        cellSize: 0,
        data: Array<any>()
    };

    private initializeParameters(viewport: any, minDistance: number, maxTries: number, renderer: VPRenderer) {
        this._xMin = viewport[0];
        this._xMax = viewport[2];
        this._yMin = viewport[1];
        this._yMax = viewport[3];
        this._radius = Math.max(minDistance, 1);
        this._k = Math.max(maxTries, 2);

        this._grid.cellSize = this._radius * Math.SQRT1_2;
        this._grid.width = Math.ceil((this._xMax - this._xMin) / this._grid.cellSize);
        this._grid.height = Math.ceil((this._yMax - this._yMin) / this._grid.cellSize);
        this._grid.data = new Array(this._grid.width * this._grid.height);

        let rand = require('random-seed').create(renderer.seed);
        this.random = () => {
            let num = rand.floatBetween(0, 1);
            return num;
        };
    }

    private initializeState() {
        this._pointQueue = new Array(0);
        this._firstPoint = true;
        for (let i = 0; i < this._grid.data.length; i++) {
            this._grid.data[i] = null;
        }
    }

    private dist2(x1: number, y1: number, x2: number, y2: number) {
        return ((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1));
    }

    private createNewPoint(x: number, y: number) {
        let point = {x: x, y: y};
        let index = Math.floor(x / this._grid.cellSize) + Math.floor(y / this._grid.cellSize) * this._grid.width;
        this._grid.data[index] = point;
        this._pointQueue.push(point);
        return point;
    }

    private isValidPoint(x: number, y: number) {
        if (x < this._xMin || x > this._xMax || y < this._yMin || y > this._yMax)
            return false;
        
        let col = Math.floor((x-this._xMin) / this._grid.cellSize);
        let row = Math.floor((y-this._yMin) / this._grid.cellSize);
        let idx = 0, i = 0, j = 0;
        for (i = col-2; i <= col+2; i++) {
            for (j = row-2; j <= row+2; j++) {
                if (i >= 0 && i < this._grid.width && j >= 0 && j < this._grid.height) {
                    idx = i + (j * this._grid.width);
                    if (this._grid.data[idx] !== null &&
                        this.dist2(x, y, this._grid.data[idx].x, this._grid.data[idx].y) <= (this._radius*this._radius)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    private nextPoint() {
        let x = 0;
        let y = 0;
        if (this._firstPoint) {
            this._firstPoint = false;
            x = this._xMin + (this._xMax - this._xMin) * this.random();
            y = this._yMin + (this._yMax - this._yMin) * this.random();
            return this.createNewPoint(x, y);
        }
        let idx = 0, distance = 0, angle = 0;
        while (this._pointQueue.length > 0) {
            idx = (this._pointQueue.length * this.random()) | 0;
            for (let i = 0; i < this._k; i++) {
                distance = this._radius * (this.random() + 1);
                angle = 2 * Math.PI * this.random();
                x = this._pointQueue[idx].x + distance * Math.cos(angle);
                y = this._pointQueue[idx].y + distance * Math.sin(angle);
                if (this.isValidPoint(x, y)) {
                    return this.createNewPoint(x, y);
                }
            }
            this._pointQueue.splice(idx, 1);
        }
        return null;
    }

    public allPoints() {
        let point = null;
        let result = new Array(0);
        while (true) {
            point = this.nextPoint();
            if (point == null)
                break;
            else
                result.push(point);
        }
        return result;
    }

    public constructor(viewport: any, minDistance: number, maxTries: number, renderer: VPRenderer){
        this.initializeParameters(viewport, minDistance, maxTries, renderer);
        this.initializeState();
    }
}