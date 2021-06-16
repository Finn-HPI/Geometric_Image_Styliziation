import { Controls } from "../utils/control";
import { VPRenderer } from "./vpRenderer";

export class LodSettings{

    protected _lod: Map<string, number> = new Map<string, number>([
        ['Black & White', 0],
        ['Color', 1]
    ]);

    protected _renderer!: VPRenderer;
    protected _control!: Controls;

    public constructor(renderer: VPRenderer){
        this._renderer = renderer;
        this._control = new Controls('controls-container2', 'point-canvas');
    }

    public init(){
        const lodControl = this._control.createSelectListInput(
            'Mode', Array.from(this._lod.keys()));

        lodControl.addEventListener('change', (event) => {
            this._renderer.setLodMode(Number(this._lod.get((event.target as HTMLInputElement).value)));
        });

        const lodButtons = this._control.createActionButton('LOD Mask');
        lodButtons.addEventListener('click', () => {
            this._renderer.showLodMask();
        });

        const depth = this._control.createNumberInput(
            'Depth', '', 0, '', 0, 1, 0.05
        );

        depth.addEventListener('change', (event) => {
            this._renderer.updateConfiguration(0, Number((event.target as HTMLInputElement).value));
        });

        const matting = this._control.createNumberInput(
            'Matting', '', 0, '', 0, 1, 0.05
        );

        matting.addEventListener('change', (event) => {
            this._renderer.updateConfiguration(1, Number((event.target as HTMLInputElement).value));
        });

        const saliencya = this._control.createNumberInput(
            'Saliency (A)', '', 0, '', 0, 1, 0.05
        );

        saliencya.addEventListener('change', (event) => {
            this._renderer.updateConfiguration(2, Number((event.target as HTMLInputElement).value));
        });

        const saliencyo = this._control.createNumberInput(
            'Saliency (O)', '', 0, '', 0, 1, 0.05
        );

        saliencyo.addEventListener('change', (event) => {
            this._renderer.updateConfiguration(3, Number((event.target as HTMLInputElement).value));
        });

        const normal = this._control.createNumberInput(
            'Normal', '', 0, '', 0, 1, 0.05
        );
        
        normal.addEventListener('change', (event) => {
            this._renderer.updateConfiguration(4, Number((event.target as HTMLInputElement).value));
        });

        const normalX = this._control.createSliderInput(
            'Normal.x', '', 0, '', -1, 1, 0.05, 'sampleSlider');

        normalX.addEventListener('change', (event) => {
            this._renderer.updateConfiguration(5, Number((event.target as HTMLInputElement).value));
        });

        const normalY = this._control.createSliderInput(
            'Normal.y', '', 0, '', -1, 1, 0.05, 'sampleSlider');

        normalY.addEventListener('change', (event) => {
            this._renderer.updateConfiguration(6, Number((event.target as HTMLInputElement).value));
        });

        const normalZ = this._control.createSliderInput(
            'Normal.z', '', 0, '', -1, 1, 0.05, 'sampleSlider');

        normalZ.addEventListener('change', (event) => {
            this._renderer.updateConfiguration(7, Number((event.target as HTMLInputElement).value));
        });

        this._renderer.addInput('depth', depth);
        this._renderer.addInput('matting', matting);
        this._renderer.addInput('saliencya', saliencya);
        this._renderer.addInput('saliencyo', saliencyo);
        this._renderer.addInput('normal', normal);
        this._renderer.addInput('normalx', normalX);
        this._renderer.addInput('normaly', normalY);
        this._renderer.addInput('normalz', normalZ);
    }
}