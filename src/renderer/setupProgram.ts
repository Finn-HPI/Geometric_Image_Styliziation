import { 
    Context,
    Program, 
    Shader
} from "webgl-operate";

export function setupProgram(
    vertexShader: string, fragmentShader: string,
    context: Context, vertexLocation: number
): Program {
    let valid = true;

    const vert = new Shader(context, context.gl.VERTEX_SHADER);
    valid &&= vert.initialize(vertexShader);

    const frag = new Shader(context, context.gl.FRAGMENT_SHADER);
    valid &&= frag.initialize(fragmentShader);
    
    const program = new Program(context);
    valid &&= program.initialize([vert, frag], false);

    program.attribute('a_vertex', vertexLocation);
    valid &&= program.link();

    program.bind();
    context.gl.uniform1i(program.uniform('u_original'), 0);
    context.gl.uniform1i(program.uniform('u_depth'), 1);
    context.gl.uniform1i(program.uniform('u_mattness'), 2);
    context.gl.uniform1i(program.uniform('u_normal'), 3);
    context.gl.uniform1i(program.uniform('u_saliencya'), 4);
    context.gl.uniform1i(program.uniform('u_saliencyo'), 5);
    context.gl.uniform1i(program.uniform('u_segmentation'), 6);
    program.unbind();

    if(!valid)
        console.log('shader setup failed!');

    return program;
}