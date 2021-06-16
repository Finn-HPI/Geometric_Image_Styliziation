import { Controls } from "../utils/control";
import { Mode, VPRenderer } from "./vpRenderer";
import { Color, Point } from "paper";
import { BrushMode } from "../visuals/brushtool";
import { NoiseMode, NoiseTool } from "../visuals/noise";
import { BlueNoise } from "../noise/bluenoise";
import Vec2 from "vec2";

export class GeneralSettings{

    protected _sampling: Map<string, number> = new Map<string, number>([
        ['Blue Noise', 0],
        ['Regular Grid', 1],
        ['White Noise', 2]
    ]);

    protected _brushModes: Map<string, BrushMode> = new Map<string, BrushMode>([
        ['Add Detail', BrushMode.ADD],
        ['Remove Detail', BrushMode.REMOVE]
    ]);

    protected _sampleModes: Map<string, NoiseMode> = new Map<string, NoiseMode>([
        ['Simple', NoiseMode.SIMPLE],
        ['BlueNoise', NoiseMode.BLUE_NOISE]
    ]);

    protected _control!: Controls;
    protected _renderer!: VPRenderer;
    protected _noiseTool!: NoiseTool;
    protected _noiseGenerator!: BlueNoise;

    protected _minDist!: number;
    protected _maxTries!: number;

    protected _sampleMode!: NoiseMode;
    protected _points!: Array<Vec2>;
    protected _sampleData!: Uint8Array;

    public constructor(renderer: VPRenderer){
        this._renderer = renderer;
        this._noiseTool = new NoiseTool(this._renderer.canvasSize);
        this._control = new Controls('controls-container3', 'webgl-canvas');
        this._minDist = 10;
        this._maxTries = 30;
        this._sampleMode = NoiseMode.SIMPLE;
    }

    public init(){

        const sampleMode = this._control.createSelectListInput(
            'Sampling', Array.from(this._sampleModes.keys()));

        sampleMode.addEventListener('change', (event) => {
            this._sampleMode = this._sampleModes.get((event.target as HTMLInputElement).value) as number;
            this.updateBlueNoise();
        });

        const minDist = this._control.createSliderInput(
            'minDist', '', 10, '', 0, 200, 1, 'minDistSlider');

        minDist.addEventListener('change', (event) => {
            this._minDist = Number((event.target as HTMLInputElement).value);
            this.updateBlueNoise();
        });

        const maxTries = this._control.createSliderInput(
            'maxTries', '', 30, '', 0, 200, 1, 'maxTriesSlider');

        maxTries.addEventListener('change', (event) => {
            this._maxTries = Number((event.target as HTMLInputElement).value);
            this.updateBlueNoise();
        });

        const probability = this._control.createSliderInput(
            'probability', '', 0.3, '', 0, 1, 0.005, 'probabilitySlider');

        probability.addEventListener('change', (event) => {
            this._renderer.exportPass.probability = Number((event.target as HTMLInputElement).value);
        });

        const sampleButton = this._control.createActionButton('Sample');
        sampleButton.addEventListener('click', () => {
            switch(this._sampleMode){
                case NoiseMode.SIMPLE:
                    this._renderer.mode = Mode.SAMPLE;
                    this._renderer.updateChange();
                    break;
                case NoiseMode.BLUE_NOISE:
                    this._noiseTool.clear();
                    this._noiseTool.showSampling(this._points, this._renderer.canvasSize[0], this._renderer.canvasSize[1]);
                    break;
            }
        });

        const maxColorCount = this._control.createSliderInput(
            'max color count', '', 0, '', 1, 256, 1, 'max colorCount');

        maxColorCount.addEventListener('change', (event) => {
            this._renderer.maxColorCount = (event.target as HTMLInputElement).valueAsNumber;
            this._renderer.treeSelector.reset();
        });

        const brushMode = this._control.createSelectListInput(
            'Image', Array.from(this._brushModes.keys()));

        brushMode.addEventListener('change', (event) => {
            let mode = this._brushModes.get((event.target as HTMLInputElement).value) as number;
            this._renderer.brushTool.mode = mode;
        });

        const clear = this._control.createActionButton('Clear');
        clear.addEventListener('click', () => {
            this._renderer.brushTool.clear();
        });

        const alpha = this._control.createSliderInput(
            'Brush Intensity', '', 0.5, '', 0, 1, 0.05, 'Lod');

        alpha.addEventListener('change', (event) => {
            this._renderer.brushTool.alpha = (event.target as HTMLInputElement).valueAsNumber;
        });

        const range = this._control.createSliderInput(
            'Brush Size', '', 10, '', 1, 100, 1, 'range');

        range.addEventListener('change', (event) => {
            this._renderer.brushTool.radius = (event.target as HTMLInputElement).valueAsNumber;
        });

        let svg = document.getElementById('mask-canvas') as HTMLCanvasElement;
        svg.addEventListener('mousedown', (event) => {
            this._renderer.brushTool.mouseDown(new Point(event.offsetX, event.offsetY))
        });
        svg.addEventListener('mouseup', (event) => {
            this._renderer.brushTool.mouseUp(new Point(event.offsetX, event.offsetY));
        });
        svg.addEventListener('mousemove', (event) => {
            if(this._renderer.brushTool.isMousePressed)
                this._renderer.brushTool.mouseMove(new Point(event.offsetX, event.offsetY));
        });

        this._renderer.addInput('probability', probability);
        this._renderer.addInput('minDist', minDist);
        this._renderer.addInput('maxTries', maxTries);
        this._renderer.addInput('maxColorCount', maxColorCount);
        this._renderer.addSelect('sampleMode', sampleMode);
    }

    public updateBlueNoise(){
        this._renderer.treeSelector.reset();
        if(this._sampleMode == NoiseMode.BLUE_NOISE){
            this.generateSampleData();
        }
    }


    public generateSampleData(){
        let width = this._renderer.canvasSize[0], height = this._renderer.canvasSize[1];
        let viewport = [0, 0, width, height];
        this._noiseGenerator = new BlueNoise(viewport, this._minDist, this._maxTries, this._renderer);
        this._points = this._noiseGenerator.allPoints();
        this._sampleData = new Uint8Array(width * height * 4);
        this._points.forEach((each: Vec2) => {
            const i = ((height -1 - Math.floor(each.y)) * width + Math.floor(each.x)) * 4;
            this._sampleData[i] = 0;
            this._sampleData[i+1] = 0;
            this._sampleData[i+2] = 0;
            this._sampleData[i+3] = 1;
        });
    }

    public get sampleMode(){
        return this._sampleMode;
    }

    public get sampleData(){
        return this._sampleData;
    }

    public clear(){
        this._noiseTool.clear();
    }

    public needsSetup(){
        this._noiseTool.needsSetup();
    }
}