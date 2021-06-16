import Jimp from "jimp";
import { ModelRunner } from "../model/modelRunner";
import { Controls } from "../utils/control";
import { BuildModes } from "../visuals/svgBuilder";
import { Layer } from "./layer";
import { VPRenderer, Mode} from "./vpRenderer";

export class ImgSettings{

    protected _images: Map<string, string> = new Map<string, string>([
        ['Portrait', 'portrait.png'],
        ['Portrait2', 'portrait2.png'],
        ['Portrait3', 'portrait3.png'],
        ['Architecture', 'architecture.png'],
        ['Architecture2', 'architecture2.png'],
        ['Cat', 'cat.png'],
        ['Group', 'group.png'],
        ['Group2', 'group2.png'],
        ['Indoor', 'indoor.png'],
        ['Indoor2', 'indoor2.png'],
        ['IPhone', 'iPhone.png'],
        ['Landscape', 'landscape.png'],
        ['Landscape2', 'landscape2.png'],
        ['Panorama', 'panorama.png']
    ]);

    protected _layers: Map<string, number> = new Map<string, number>([
        ['RGB', 0],
        ['Depth', 1],
        ['Matting', 2],
        ['Normal', 3],
        ['Saliency Attention', 4],
        ['Saliency Objectness', 5],
        ['Segmentation', 6],
    ]);

    protected _buildModes: Map<string, BuildModes> = new Map<string, BuildModes>([
        ['Circle', BuildModes.CIRCLE],
        ['RegularPolygon', BuildModes.REG_POLY]
    ]);

    protected _control!: Controls;
    protected _renderer!: VPRenderer;

    public constructor(renderer: VPRenderer){
        this._renderer = renderer;
        this._control = new Controls('controls-container', 'webgl-canvas');
    }

    public init(){
        const imageControl = this._control.createSelectListInput(
            'Image', Array.from(this._images.keys()));

        imageControl.addEventListener('change', (event) => {
            let file = this._images.get((event.target as HTMLInputElement).value);
            this._renderer.loadImages(file as string);
        });

        const fileInput = this._control.createFileInput(
        'Upload', 'image/png');

        fileInput.addEventListener('change', (event) => {
            let target = (event.target as HTMLInputElement);
            if(!target || !target.files) 
                return;
            const file = target.files[0];
            if (!file) 
                return;

            const runner = new ModelRunner();

            if(file.type.match(/image.*/)){
                const reader = new FileReader();
                reader.onload = (event: any) => {
                    Jimp.read(event.target.result).then((img) => {
                        console.log(img.bitmap.data);
                        runner.inputImage(img);
                    });
                };
                reader.readAsDataURL(file);

            }
        });

        const layer = this._control.createSelectListInput(
            'Layer', Array.from(this._layers.keys()));

        layer.addEventListener('change', (event) => {
            this._renderer.renderPass.layerMode = Number(this._layers.get((event.target as HTMLInputElement).value));
            this._renderer.mode = Mode.NORMAL;
            this._renderer.updateChange();
        });

        const buildButton = this._control.createActionButton('Build');
        buildButton.addEventListener('click', () => {
            this.build();
        });

        const exportButton = this._control.createActionButton('Export');
        exportButton.addEventListener('click', () => {
            this._renderer.builder.export('svg');
            this._renderer.exportConfig();
        });

        const importConfig = this._control.createFileInput(
            'Import Config', 'json');
    
        importConfig.addEventListener('change', (event) => {
            let target = (event.target as HTMLInputElement);
            if(!target || !target.files) 
                return;
            const file = target.files[0];
            if (!file) 
                return;
            const reader = new FileReader();
            reader.onload = () => {
                this._renderer.importConfig(JSON.parse(reader.result as string));
            };
            reader.readAsText(file);
        });

        const seedButton = this._control.createActionButton('Renew Seed');
        seedButton.addEventListener('click', () => {
           this._renderer.seed = '';
           this._renderer.updateSeed();
           this._renderer.generalSettings.updateBlueNoise();
        });

        const gltfButton = this._control.createActionButton('Export GLTF');
        gltfButton.addEventListener('click', () => {
            console.log('try exporting as gltf');
            this._renderer.builder.exportToGltf();
        });
    }

    public build(){
        this._renderer.builder.reset();
        this._renderer.treeSelector.deactivate();
            this._renderer.treeSelector.layers.forEach((value: Layer) => {
                let type = value.tree;
                this._renderer.initTree(type);
                this._renderer.tree.clipPath = value.clipPath;
                this._renderer.tree.buildFrom(value.points, this._renderer.canvasSize[0], this._renderer.canvasSize[1], value.color, this._renderer);

                console.log(this._renderer.tree);
                this._renderer.builder.buildFrom(
                    this._renderer.tree, 
                    this._renderer.canvasSize[0], 
                    this._renderer.canvasSize[1], 
                    type, 
                    value.maxLod, 
                    value.maxLevel,
                    this._renderer.globalSettings.getBorderSettings()
                );
               this._renderer.builder.treeToSvg();
            });
            this._renderer.builder.applyNewBorderSettings(this._renderer.globalSettings.getBorderSettings());
            this._renderer.builder.displayOnCanvas('svg');
            this._renderer.brushTool.needsSetup();
            this._renderer.treeSelector.needsSetup();
            this._renderer.generalSettings.needsSetup();
    }

    public get images(){
        return this._images;
    }
}