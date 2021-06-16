import { Color } from "paper/dist/paper-core";
import { getColorFromHex } from "../utils/colorUtil";
import { Controls } from "../utils/control";
import { VPRenderer } from "./vpRenderer";

export enum BorderMode{
    FILL, FILL_AND_BORDER, BORDER
}

export interface BorderSettings {
    mode: BorderMode,
    border0: number,
    border1: number,
    color0: paper.Color,
    color1: paper.Color
}

export class GlobalSettings {

    protected _borderModes: Map<string, BorderMode> = new Map<string, BorderMode>([
        ['Fill', BorderMode.FILL],
        ['Fill + Border', BorderMode.FILL_AND_BORDER],
        ['Border/Wireframe', BorderMode.BORDER]
    ]);

    protected _borderMode!: BorderMode;
    protected _borderWidth0!: number;
    protected _borderWidth1!: number;
    protected _color0!: paper.Color;
    protected _color1!: paper.Color;

    protected _renderer!: VPRenderer;
    protected _canvasSize!: [number, number];
    protected _control!: Controls;

    public constructor(renderer: VPRenderer){
        this._renderer = renderer;
        let canvas = (document.getElementById('webgl-canvas') as HTMLCanvasElement);
        this._canvasSize = [canvas.width, canvas.height];
        this._control =  new Controls('controls-container7', 'point-canvas');
    }

    public init(){
        this._borderMode = BorderMode.FILL;
        this._borderWidth0 = 0.3;
        this._borderWidth1 = this._borderWidth0;
        this._color0 = new Color(0,0,0);
        this._color1 = this._color0;

        const borderMode = this._control.createSelectListInput(
            'Criteria', Array.from(this._borderModes.keys()));
        borderMode.addEventListener('change', (event) => {
            this._borderMode = this._borderModes.get((event.target as HTMLInputElement).value) as BorderMode;
        });

        const borderWidth0 = this._control.createNumberInput(
            'borderWidth [minLevel]', '', 0.3, '', 0, 20, 0.1
        );
        borderWidth0.addEventListener('change', (event) => {
            this._borderWidth0 =  Number((event.target as HTMLInputElement).value);
        });

        const borderWidth1 = this._control.createNumberInput(
            'borderWidth [maxLevel]', '', 0.3, '', 1, 20, 0.1
        );
        borderWidth1.addEventListener('change', (event) => {
            this._borderWidth0 =  Number((event.target as HTMLInputElement).value);
        });

        const color0 = this._control.createColorInput('color [minLevel]');
        color0.addEventListener('change', (event) => {
            let hex = (event.target as HTMLInputElement).value;
            this._color0 = getColorFromHex(hex);
        });

        const color1 = this._control.createColorInput('color [maxLevel]');
        color1.addEventListener('change', (event) => {
            let hex = (event.target as HTMLInputElement).value;
            this._color1 = getColorFromHex(hex);
        });

        const applyButton = this._control.createActionButton('Apply on existing SVG');
        applyButton.addEventListener('click', () => {
            this._renderer.builder.applyNewBorderSettings(this.getBorderSettings());
            this._renderer.builder.displayOnCanvas('svg');
            this._renderer.brushTool.needsSetup();
            this._renderer.treeSelector.needsSetup();
            this._renderer.generalSettings.needsSetup();
        });

        this._renderer.addSelect('borderMode', borderMode);
        this._renderer.addInput('borderWidth1', borderWidth0);
        this._renderer.addInput('borderWidth1', borderWidth1);
        this._renderer.addInput('color0', color0);
        this._renderer.addInput('color1', color1);
    }

    public getBorderSettings(){
        let settings: BorderSettings = {
            mode: this._borderMode,
            border0: this._borderWidth0,
            border1: this._borderWidth1,
            color0: this._color0,
            color1: this._color1
        }
        return settings;
    }
}