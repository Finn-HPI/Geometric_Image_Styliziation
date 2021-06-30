import { Point } from "paper/dist/paper-core";
import { PointSelector, Mode } from "../visuals/pointSelector";
import { PointViwer } from "../visuals/pointViewer";
import { DataPoint } from "../trees/dataPoint";
import { Controls } from "../utils/control";
import { Layer } from "./layer";
import { VPRenderer } from "./vpRenderer";
import { DataStructure } from "../visuals/svgBuilder";
import { ColorMode } from "../trees/tree";

export class TreeSelector {

    protected _canvasSize!: [number, number];

    protected _criteria: Map<string, number> = new Map<string, number>([
        ['Lod', 0],
        ['Depth', 1],
        ['Matting', 2],
        ['Saliency Attention', 3],
        ['Saliency Objectness', 4],
    ]);

    protected _trees: Map<string, DataStructure> = new Map<string, DataStructure>([
        ['VP', DataStructure.VP],
        ['Quad', DataStructure.QUAD],
        ['KD', DataStructure.KD]
    ]);

    protected _colorModes: Map<string, ColorMode> = new Map<string, ColorMode>([
        ['Median', ColorMode.MEDIAN],
        ['Average', ColorMode.AVG],
        ['Point', ColorMode.POINT]
    ]);

    protected _keep = false;

    protected _remainingPoints!: DataPoint[];
    protected _pointSelector!: PointSelector;
    protected _pointViewer!: PointViwer;

    protected _control!: Controls;
    protected _control2!: Controls;
    protected _list!: Controls;

    protected _selectedCriteria!: string;
    protected _selectedColorMode!: string;
    protected _selectedTree!: string;
    protected _from!: number;
    protected _to!: number;

    protected _keys!: HTMLButtonElement[];
    protected _layers!: Map<HTMLButtonElement, Layer>;

    protected _renderer!: VPRenderer;
    protected _reset: boolean = false;
    protected _maxLevel!: number;

    public constructor(renderer: VPRenderer){
        this._renderer = renderer;
        let canvas = (document.getElementById('webgl-canvas') as HTMLCanvasElement);
        this._canvasSize = [canvas.width, canvas.height];
        this._selectedCriteria = 'Lod';
        this._selectedColorMode = 'Median';
        this._selectedTree = 'VP';
        this._from = 0;
        this._to = 0;
        this._maxLevel = 15;

        this._control =  new Controls('controls-container4', 'point-canvas');
        this._control2 =  new Controls('controls-container6', 'point-canvas');
        this._list =  new Controls('controls-container5', 'point-canvas');

        this._keys = [];
        this._layers = new Map<HTMLButtonElement, Layer>();
        this._pointSelector = new PointSelector(this._canvasSize);
        this._pointViewer = new PointViwer(this._canvasSize);
    }

    public init(){

        const addButton = this._control.createActionButton('Add Layer');
        addButton.addEventListener('click', () => {
            this.addLayer();
        });

        const removeButton = this._control.createActionButton('Remove last');
        removeButton.addEventListener('click', () => {
            this.deleteLast();
        });

        const criteria = this._control.createSelectListInput(
            'Criteria', Array.from(this._criteria.keys()));
        criteria.addEventListener('change', (event) => {
            this._selectedCriteria = (event.target as HTMLInputElement).value;
        });

        const tree = this._control.createSelectListInput(
            'Tree', Array.from(this._trees.keys()));
        tree.addEventListener('change', (event) => {
            this._selectedTree = (event.target as HTMLInputElement).value;
        });

        const from = this._control.createNumberInput(
            'from', '', 0, '', 0, 1, 0.05
        );
        from.addEventListener('change', (event) => {
            this._from =  Number((event.target as HTMLInputElement).value);
        });

        const to = this._control.createNumberInput(
            'to', '', 0, '', 0, 1, 0.05
        );
        to.addEventListener('change', (event) => {
            this._to =  Number((event.target as HTMLInputElement).value);
        });

        const color = this._control.createSelectListInput(
            'Color', Array.from(this._colorModes.keys()));
        color.addEventListener('change', (event) => {
            this._selectedColorMode = (event.target as HTMLInputElement).value;
        });

        const pointButton = this._control.createActionButton('reduce points');
        pointButton.addEventListener('click', () => {
            pointButton.value = this._keep? 'reduce points' : 'keep points';
            this._keep = !this._keep;
        });

        const maxLevel = this._control.createSliderInput(
            'max Level', '', 15, '', 0, 40, 1, 'range');

        maxLevel.addEventListener('change', (event) => {
            this._maxLevel = (event.target as HTMLInputElement).valueAsNumber
        });

        let svg = document.getElementById('clip-canvas') as HTMLCanvasElement;
        svg.addEventListener('mousedown', (event) => {
            this._pointSelector.mouseDown(new Point(event.offsetX, event.offsetY));
        });
        svg.addEventListener('mouseup', (event) => {
            this._pointSelector.mouseUp(new Point(event.offsetX, event.offsetY));
        });
        svg.addEventListener('mousemove', (event) => {
            if(this._pointSelector.mousePressed)
                this._pointSelector.mouseMove(new Point(event.offsetX, event.offsetY));
        });

        const rectButton = this._control2.createActionButton('Rect');
        rectButton.addEventListener('click', () => {
            this._pointSelector.mode = Mode.RECT;
        });

        const customButton = this._control2.createActionButton('Custom');
        customButton.addEventListener('click', () => {
            this._pointSelector.mode = Mode.CUSTOM;
        });

        const convexHullButton = this._control2.createActionButton('Convex Hull');
        convexHullButton.addEventListener('click', () => {
            this._pointSelector.mode = Mode.HULL;
            this._pointSelector.generateConvexHull();
        });

        const applyButton = this._control2.createActionButton('Apply');
        applyButton.addEventListener('click', () => {
            this._pointSelector.applyClipPath();
            this._pointSelector.clear();
        });

        const clearButton = this._control2.createActionButton('Clear');
        clearButton.addEventListener('click', () => {
            this._pointViewer.clear();
        });

        this._renderer.addInput('from', from);
        this._renderer.addInput('to', to);
        this._renderer.addInput('maxLevel', maxLevel);

        this._renderer.addSelect('criteria', criteria);
        this._renderer.addSelect('color', color);
        this._renderer.addSelect('tree', tree);
    }

    public addLayer(
        tree: string = this._selectedTree, 
        criteria: string = this._selectedCriteria,
        color: string = this._selectedColorMode,
        from: number = this._from,
        to: number = this._to,
        maxLevel: number = this._maxLevel,
        keep: boolean = this._keep
    ){
        if(this._remainingPoints == undefined || this._reset){
            this._remainingPoints = this._renderer.generatePointData();
            this._reset = false;
        }

        const button = this._list.createActionButton('[' + tree + '] ' + criteria + ': ' + from + '-' + to);
        let layer = new Layer(
            this._trees.get(tree) as DataStructure,
            this._criteria.get(criteria) as number,
            this._colorModes.get(color) as number,
            tree,
            criteria,
            color,
            from,
            to,
            this._remainingPoints,
            this._canvasSize,
            keep
        );
        layer.maxLevel = maxLevel;
        button.addEventListener('click', () => {
            this._pointViewer.showPoints(layer);
            this._pointSelector.currentLayer = layer;
        });
        this._layers.set(button, layer);
        this._keys.push(button);
        this._remainingPoints = layer.remainingPoints;
    }

    public reset(){
        this._reset = true;
    }

    public get layers(){
        return this._layers;
    }

    public deleteLast(){
        let last = this._keys.pop();
        if(last == undefined) return;
        last.remove();
        this._remainingPoints = (this._layers.get(last) as Layer).preRemainingPoints;
        this._layers.delete(last);
    }

    public clearLayer(){
        let last = this._keys.pop();
        while(last !== undefined){
            last.remove();
            this._remainingPoints = (this._layers.get(last) as Layer).preRemainingPoints;
            this._layers.delete(last);
            last = this._keys.pop();
        }
        this.reset();
    }

    public needsSetup(){
        this._pointViewer.needsSetup();
        this._pointSelector.needsSetup();
    }

    public deactivate(){
        this._pointViewer.deactivate();
    }
}
