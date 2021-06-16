import Jimp from "jimp";
import { Context, DefaultFramebuffer, Framebuffer, Renderer, Texture2D} from "webgl-operate";
import { ExportPass } from "./exportPass";
import { RenderPass, TextureType } from "./renderPass";
import { BrushTool } from "../visuals/brushtool";
import { generateDataFrom } from "../utils/buildUtil";
import { QuadTree } from "../trees/quad/quadTree";
import { TreeSelector } from "./treeLayerSelector";
import { DataPoint } from "../trees/dataPoint";
import { VPTree } from "../trees/vp/vpTree";
import { KdTree } from "../trees/kd/kdTree";
import { LodSettings } from "./lodSettings";
import { ImgSettings } from "./imgSettings";
import { GeneralSettings } from "./generalSettings";
import { Layer } from "./layer";
import { NoiseMode } from "../visuals/noise";
import { defaultConfig } from "../config/default";
import { DataStructure, SVGBuilder } from "../visuals/svgBuilder";
import { v4 as uuidv4 } from 'uuid';
import { GlobalSettings } from "./globalSettings";

export enum Mode {
    NORMAL,
    NORMAL_EXPORT,
    LOD,
    LOD_EXPORT,
    SAMPLE,
    SAMPLE_EXPORT
}

interface InputItemI {
    name: string,
    value: string;
};

interface SelectItemI {
    name: string,
    value: number;
};
interface LayerI {
    criteria: string,
    color: string,
    tree: string,
    from: number,
    to: number,
    maxLevel: number,
    keep: boolean
}
export class VPRenderer extends Renderer {

    protected _lastMode: Mode = Mode.NORMAL;

    protected _gl!: WebGL2RenderingContext;
    protected _context!: Context;

    protected _rawImage!: Jimp;
    protected _type!: TextureType;

    protected _exportPass!: ExportPass;
    protected _renderPass!: RenderPass;

    protected _outputFBO!: DefaultFramebuffer;
    protected _exportFBO!: Framebuffer;

    protected _exportTextures!: [Texture2D, Texture2D];
    protected _imgResolutions!: Float32Array;
    protected _textures!: Uint8Array[];
    protected _loadedTextures!: number;

    protected _builder!: SVGBuilder;
    protected _brushTool!: BrushTool;
    protected _tree!: any;

    protected _loaded: boolean = false;

    protected _mode = Mode.NORMAL;
    protected _inputChanged!: boolean;

    protected _treeSelector!: TreeSelector;
    protected _lodSettings!: LodSettings;
    protected _imgSettings!: ImgSettings;
    protected _generalSettings!: GeneralSettings;
    protected _globalSettings!: GlobalSettings;

    protected _inputs!: Map<string, HTMLInputElement>;
    protected _selects!: Map<string, HTMLSelectElement>;

    protected _maxColorCount!: number;
    protected _seed!: string;

    private dumpPixelData(): Uint8Array{
        const w = this.canvasSize[0];
        const h = this.canvasSize[1];
        const out = new Uint8Array(w * h * 4);
        this._exportFBO.bind();
        this._gl.readPixels(
            0, 0, w, h, this._gl.RGBA, this._gl.UNSIGNED_BYTE, out
        );
        this._exportFBO.unbind();
        return out;
    }

    private loadTexture(path: string, type: TextureType): void {
        Jimp.read(path).then((img) => {
            console.log('loading ', TextureType[type]);
            this._rawImage = img;
            this._rawImage.flip(false, true);
            this.resizeTexture(type);
        });
    }
   
    private resizeTexture(type: TextureType): void {
        console.log('resizing ', TextureType[type]);

        this._renderPass.initTexture(type);
        this._exportPass.initTexture(type);

        let img = new Jimp(this._rawImage);
        img.cover(this._canvasSize[0], this._canvasSize[1]);
        let onlyRGB = img.bitmap.data.filter((v, i) => i % 4 !== 3);

        this._textures[type] = new Uint8Array(onlyRGB.length);
        this._type = type;

        for(let i = 0; i < onlyRGB.length; i++)
            this._textures[type][i] = onlyRGB[i];

        this._imgResolutions[type * 2] = img.bitmap.width;
        this._imgResolutions[type * 2 + 1] = img.bitmap.height;
        this._loadedTextures++;

        if(this._loadedTextures >= this._textures.length){
            console.log('loading finished');
            this.updateChange();
            this._treeSelector.reset();
            if(!this._loaded){
                this._loaded = true;
                this.afterInitialLoadComplete();
            }
        }
    }

    private afterInitialLoadComplete(){
        setTimeout(() => {
            this.importConfig(defaultConfig());
        }, 100);
    }

    public loadImages(file: string){
        
        this._loadedTextures = 0;
        this.loadTexture('img/depth/fcrn/' + file, TextureType.Depth);
        this.loadTexture('img/input/' + file, TextureType.Input);
        this.loadTexture('img/matting/modnetcamera/' + file, TextureType.Matting);
        this.loadTexture('img/normal/' + file, TextureType.Normal);
        this.loadTexture('img/saliency/attention/' + file, TextureType.SaliencyA);
        this.loadTexture('img/saliency/objectness/' + file, TextureType.SaliencyO);
        this.loadTexture('img/segmentation/deeplab1/' + file, TextureType.Segmentation);

        this._mode = Mode.NORMAL;
    }

    protected onInitialize(context: Context): boolean {

        this._inputs = new Map<string, HTMLInputElement>();
        this._selects = new Map<string, HTMLSelectElement>();

        this._context = context;
        this._gl = context.gl;
        this._textures = new Array(7);
        this._imgResolutions = new Float32Array(7 * 2);

        this._builder = new SVGBuilder();
        this._brushTool = new BrushTool();

        this._maxColorCount = 0;
        this.updateSeed();

        let valid = true;
        this._outputFBO = new DefaultFramebuffer(context);
        valid &&= this._outputFBO.initialize();

        this._exportTextures = [
            new Texture2D(this._context), new Texture2D(this._context)
        ];

        valid &&= this._exportTextures[0].initialize(1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);
        valid &&= this._exportTextures[1].initialize(1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);
        
        this._exportFBO = new Framebuffer(this._context);
        valid &&= this._exportFBO.initialize([
            [this._gl.COLOR_ATTACHMENT0, this._exportTextures[0]]
        ]);

        this._exportPass = new ExportPass(context);
        valid &&= this._exportPass.initialize();
        this._renderPass = new RenderPass(context);
        valid &&= this._renderPass.initialize();
        
        this._gl.pixelStorei(this._context.gl.UNPACK_ALIGNMENT, 1);

        this._treeSelector = new TreeSelector(this);
        this._lodSettings = new LodSettings(this);
        this._imgSettings = new ImgSettings(this);
        this._generalSettings = new GeneralSettings(this);
        this._globalSettings = new GlobalSettings(this);

        this._treeSelector.init();
        this._lodSettings.init();
        this._imgSettings.init();
        this._generalSettings.init();
        this._globalSettings.init();

        this.loadImages(this._imgSettings.images.values().next().value);
        return valid;
    }

    public updateSeed(){
        if(this._seed == undefined || this._seed.length == 0)
            this._seed = uuidv4();
    }

    public initTree(type: DataStructure){
        switch(type){
            case DataStructure.VP: this._tree = new VPTree();
                break;
            case DataStructure.QUAD: this._tree = new QuadTree();
                break;
            case DataStructure.KD: this._tree = new KdTree();
                break;
        }
    }

    public generatePointData(): DataPoint[]{

        let sampleData: Uint8Array;
        let lodData: Uint8Array;
        let depthData: Uint8Array;
        let mattingData: Uint8Array;
        let saliencyAData: Uint8Array;
        let saliencyOData: Uint8Array;
        let segmentationData: Uint8Array;
        let maskData: Uint8ClampedArray;
        let colorData: Uint8Array;

        this._exportTextures[0].resize(this.canvasSize[0], this.canvasSize[1]);

        this._mode = Mode.LOD_EXPORT;
        this.onFrame();
        lodData = this.dumpPixelData();

        sampleData = this.getSampleData();

        this._mode = Mode.NORMAL_EXPORT;
        this._renderPass.layerMode = 1;
        this.onFrame();
        depthData = this.dumpPixelData();

        this._renderPass.layerMode = 2;
        this.onFrame();
        mattingData = this.dumpPixelData();

        this._renderPass.layerMode = 4;
        this.onFrame();
        saliencyAData = this.dumpPixelData();

        this._renderPass.layerMode = 5;
        this.onFrame();
        saliencyOData = this.dumpPixelData();

        this._renderPass.layerMode = 6;
        this.onFrame();
        segmentationData = this.dumpPixelData();

        this._renderPass.layerMode = 0;
        this.onFrame();
        colorData = this.dumpPixelData();

        let ctx = ((document.getElementById('mask-canvas') as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D);
        maskData = ctx.getImageData(0, 0, this.canvasSize[0], this.canvasSize[1]).data;
        maskData = new Uint8ClampedArray(this.canvasSize[0] * this.canvasSize[1] * 4);

        return generateDataFrom(
            colorData, 
            sampleData, 
            lodData, 
            depthData, 
            mattingData, 
            saliencyAData, 
            saliencyOData, 
            segmentationData, 
            maskData, 
            this.canvasSize[0], 
            this.canvasSize[1],
            this._maxColorCount
        );
    }

    public getSampleData(){
        let sampleData: Uint8Array;
        switch(this.generalSettings.sampleMode){
            case NoiseMode.SIMPLE:
                this._mode = Mode.SAMPLE_EXPORT;
            this.onFrame();
                sampleData = this.dumpPixelData();
                break;
            case NoiseMode.BLUE_NOISE:
                sampleData = this._generalSettings.sampleData;
                break;
        }
        return sampleData;
    }
    
    protected onUninitialize(): void {
        super.uninitialize();
        this._exportPass.uninitialize();
        this._renderPass.uninitialize();
        this._exportFBO.uninitialize();
        this._outputFBO.uninitialize();
    }

    public updateConfiguration(index: number, value: number){
        this._exportPass.configuration(index, value);
        this._mode = Mode.LOD;
        this.updateChange();
    }

    public setLodMode(mode: number){
        this._mode = Mode.LOD;
        this._exportPass.lodMode = mode;
        this.updateChange();
    }

    public showLodMask(){
        this._mode = Mode.LOD;
        this.updateChange();
    }

    protected onUpdate(): boolean {
        return this._altered.any || this._inputChanged;
    }

    protected onPrepare(): void {
        if (this._rawImage !== undefined && (this._canvasSize[0] !== this._imgResolutions[this._type*2] || this._canvasSize[1] !== this._imgResolutions[this._type*2+1])) {
            this.resizeTexture(this._type);
            this._inputChanged = true;
        }
        if (this._inputChanged) {
            this._renderPass.updateImage(this._textures, this._imgResolutions);
            this._exportPass.updateImage(this._textures, this._imgResolutions);
            this._inputChanged = false;
        }
    }

    protected onFrame(): void {
        let fbo: Framebuffer;
        let pass: ExportPass | RenderPass;

        switch(this._mode){
            case Mode.NORMAL:
                fbo = this._outputFBO;
                pass = this._renderPass;
                break;
            case Mode.NORMAL_EXPORT:
                fbo = this._exportFBO;
                pass = this._renderPass;
                break;
            case Mode.LOD:
                fbo = this._outputFBO;
                pass = this._exportPass
                pass.active = pass.lod;
                break;
            case Mode.LOD_EXPORT:
                fbo = this._exportFBO;
                pass = this._exportPass;
                pass.lodMode = 0;
                pass.active = pass.lod;
                break;
            case Mode.SAMPLE:
                fbo = this._outputFBO;
                pass = this._exportPass;
                pass.active = pass.sample;
                break;
            case Mode.SAMPLE_EXPORT:
                fbo = this._exportFBO;
                pass = this._exportPass;
                pass.active = pass.sample;
                break;
        }
        this._lastMode = this._mode;
        this._gl.viewport(0, 0, fbo.width, fbo.height);
        pass.target = fbo;
        pass.frame();
    }

    public exportConfig(){
        let config = { 
            input: new Array<InputItemI>(),
            select: new Array<SelectItemI>(),
            layers: new Array<LayerI>(),
            seed: this._seed
        };
        this._inputs.forEach((value: HTMLInputElement, key: string) => {
            let item: InputItemI = {name: key, value: value.value};
            config.input.push(item);
        });

        this._selects.forEach((value: HTMLSelectElement, key: string) => {
            let item: SelectItemI = {name: key, value: value.selectedIndex};
            config.select.push(item);
        });

        this._treeSelector.layers.forEach((value: Layer, key: HTMLButtonElement) => {
            let layer: LayerI = {criteria: value.criteriaAsString, color: value.colorAsString, tree: value.treeAsString, from: value.from, to: value.to, maxLevel: value.maxLevel, keep: value.keep};
            config.layers.push(layer);
        });
        let link = document.createElement("a");
        link.download = 'config.json';
        link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
        link.click();
    }

    public importConfig(config: any){

        console.log('load config');
        this._seed = config.seed;
        this.updateSeed();
        this._generalSettings.updateBlueNoise();

        config.input.forEach((each: InputItemI) => {
            let input = this._inputs.get(each.name) as HTMLInputElement;
            if(input !== null){
                input.value = each.value;
                let evt = document.createEvent("HTMLEvents");
                evt.initEvent("change", false, true);
                input.dispatchEvent(evt);
            }
        });
        config.select.forEach((each: SelectItemI) => {
            let select = this._selects.get(each.name) as HTMLSelectElement;
            if(select !== null){
                select.selectedIndex = each.value;
                let evt = document.createEvent("HTMLEvents");
                evt.initEvent("change", false, true);
                select.dispatchEvent(evt);
            }
        });

        this._treeSelector.clearLayer();
        config.layers.forEach((each: LayerI) => {
            this._treeSelector.addLayer(each.tree, each.criteria, each.color, each.from, each.to, each.maxLevel, each.keep);
        });
    }

    public updateChange(){
        this.invalidate(true);
        this._inputChanged = true;
    }

    protected onSwap(): void {};
    protected onDiscarded(): void {}

    public get treeSelector(){
        return this._treeSelector;
    }

    public get tree(){
        return this._tree;
    }

    public get builder(){
        return this._builder;
    }

    public get brushTool(){
        return this._brushTool;
    }

    public get generalSettings(){
        return this._generalSettings;
    }

    public get globalSettings(){
        return this._globalSettings;
    }

    public get renderPass(){
        return this._renderPass;
    }

    public get exportPass(){
        return this._exportPass;
    }

    public get canvasSize(){
        return this._canvasSize;
    }

    public get maxColorCount(){
        return this._maxColorCount;
    }

    public get seed(){
        return this._seed;
    }

    public addInput(label: string, input: HTMLInputElement){
        this._inputs.set(label, input);
    }

    public addSelect(label: string, select: HTMLSelectElement){
        this._selects.set(label, select);
    }

    public set mode(mode: Mode){
        this._mode = mode;
    }

    public set maxColorCount(count: number){
        this._maxColorCount = count;
    }

    public set seed(seed: string){
        this._seed = seed;
    }
}