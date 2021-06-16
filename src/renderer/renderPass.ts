import { 
    Context, 
    DefaultFramebuffer, 
    Framebuffer, 
    Initializable, 
    NdcFillingRectangle, 
    Program,
    Texture2D
} from "webgl-operate";
import { setupProgram } from "./setupProgram";

export enum TextureType {
    Input,
    Depth,
    Matting,
    Normal,
    SaliencyA,
    SaliencyO,
    Segmentation,
};

export class RenderPass extends Initializable{

    protected _context!: Context;
    protected _gl!: WebGL2RenderingContext;
   
    protected _target!: Framebuffer;

    protected _textures!: Texture2D[];
    
    protected _input!: Texture2D;
    protected _quad!: NdcFillingRectangle;

    protected _program!: Program;
    protected _layerMode!: number;

    protected _mousePressed!: boolean;    

    public constructor(context: Context){
        super();
        this._context = context;
        this._gl = context.gl;
        this._textures = new Array(7);
        this._layerMode = 0;
    }

    public initialize(): boolean {
        let valid = true;
        this._quad = new NdcFillingRectangle(this._context);
        valid &&= this._quad.initialize();
        this._program = setupProgram(
            require('./shader/quad.vert'),
            require('./shader/img.frag'),
            this._context, this._quad.vertexLocation
        );
        return valid;
    }

    public uninitialize(): void {
        this._quad.uninitialize();
        this._program.uninitialize();
        this._target.uninitialize();
    }

    public initTexture(type: TextureType): void{
        if (this._textures[type] === undefined) {
            this._textures[type] = new Texture2D(this._context, TextureType[type]);
            this._textures[type].initialize(1, 1, this._gl.RGB, this._gl.RGB, this._gl.UNSIGNED_BYTE);
            this._textures[type].wrap(this._gl.MIRRORED_REPEAT, this._gl.MIRRORED_REPEAT);
            this._textures[type].filter(this._gl.LINEAR, this._gl.LINEAR_MIPMAP_LINEAR);
        }
    }

    public updateImage(textures: Uint8Array[], resolutions: Float32Array): void {
        for(let i = 0; i < textures.length; i++)
            if(this._textures[i] !== undefined){
                this._textures[i].resize(resolutions[i*2], resolutions[i*2+1]);
                this._textures[i].data(textures[i]);
            }
    }

    public renderFrame(fbo: Framebuffer){
        for(let i = 0; i < this._textures.length; i++)
            if(this._textures[i] === undefined)
                return;

        fbo.bind();
        this._target.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT, true, false);

        this._textures[0].bind(this._gl.TEXTURE0);
        this._textures[1].bind(this._gl.TEXTURE1);
        this._textures[2].bind(this._gl.TEXTURE2);
        this._textures[3].bind(this._gl.TEXTURE3);
        this._textures[4].bind(this._gl.TEXTURE4);
        this._textures[5].bind(this._gl.TEXTURE5);
        this._textures[6].bind(this._gl.TEXTURE6);
        
        this._program.bind();

        const layerUniform = this._program.uniform('u_layerMode');
        if(layerUniform !== undefined)
            this._gl.uniform1i(layerUniform, this._layerMode);

        this._quad.bind();
        this._quad.draw();
        this._quad.unbind();

        this._program.unbind();
        this._textures.forEach(function (each) {
            each.unbind();
        });
        fbo.unbind();
    }

    public frame(): void{
       this.renderFrame(this._target);
    }

    public set target(fbo: DefaultFramebuffer){
        this._target = fbo;
    }

    public set layerMode(mode: number){
        this._layerMode = mode;
    }
}