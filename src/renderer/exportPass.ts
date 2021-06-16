import { 
    Context, 
    Framebuffer, 
    Initializable, 
    NdcFillingRectangle, 
    Program, 
    Texture2D } from "webgl-operate";
import { TextureType } from "./renderPass";
import { setupProgram } from "./setupProgram";

export class ExportPass extends Initializable {

    protected _context!: Context;
    protected _gl!: WebGL2RenderingContext;

    protected _target!: Framebuffer;
    protected _quad!: NdcFillingRectangle;

    protected _active!: Program;
    protected _lod!: Program;
    protected _sample!: Program;

    protected _textures!: Texture2D[];
    protected _configuraton!: Float32Array;
    protected _lodMode!: number;
    
    protected _probability!: number;

    public constructor(context: Context){
        super();
        this._context = context;
        this._gl = context.gl;
        this._lodMode = 0;
        this._textures = new Array(7);
        this._configuraton = new Float32Array(8);
        this._probability = 0.3;
    }

    public initialize(): boolean {
        let valid = true;

        this._quad = new NdcFillingRectangle(this._context);
        valid &&= this._quad.initialize();
        this._lod = setupProgram(
            require('./shader/quad.vert'),
            require('./shader/lod.frag'),
            this._context, this._quad.vertexLocation
        );
        this._sample = setupProgram(
            require('./shader/quad.vert'),
            require('./shader/sample.frag'),
            this._context, this._quad.vertexLocation
        );
        return valid;
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

    public uninitialize(): void {
        this._active.uninitialize();
        this._quad.uninitialize();
    }

    public frame(): void {
        this._target.bind();
        this._target.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT, false, false);

        this._textures[0].bind(this._gl.TEXTURE0);
        this._textures[1].bind(this._gl.TEXTURE1);
        this._textures[2].bind(this._gl.TEXTURE2);
        this._textures[3].bind(this._gl.TEXTURE3);
        this._textures[4].bind(this._gl.TEXTURE4);
        this._textures[5].bind(this._gl.TEXTURE5);
        this._textures[6].bind(this._gl.TEXTURE6);

        this._active.bind();

        const probUniform = this._active.uniform('u_prob');
        if(probUniform !== undefined)
            this._gl.uniform1f(probUniform, this._probability);

        const timeUniform = this._active.uniform('u_time');
        if(timeUniform !== undefined)
            this._gl.uniform1f(timeUniform, 0);
            
        const lodUniform = this._active.uniform('u_lodMode');
        if(lodUniform !== undefined)
            this._gl.uniform1i(lodUniform, this._lodMode);

        const configuration = this._active.uniform('u_configuration');
        if(configuration !== undefined)
            this._gl.uniform1fv(configuration, this._configuraton, 0, this._configuraton.length);
        
        this._quad.bind();
        this._quad.draw();
        this._quad.unbind();

        this._active.unbind();
        this._textures.forEach(function (each) {
            each.unbind();
        });
        this._target.unbind();
    }

    public get lod(){
        return this._lod;
    }

    public get sample(){
        return this._sample;
    }

    public set target(fbo: Framebuffer) {
        this._target = fbo;
    }

    public set lodMode(mode: number){
        this._lodMode = mode;
    }

    public set active(program: Program){
        this._active = program;
    }

    public configuration(index: number, value: number): void{
        this._configuraton[index] = value;
    }

    public set probability(probability: number){
        this._probability = probability;
    }
}
