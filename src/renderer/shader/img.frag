precision highp float;

uniform sampler2D u_original;
uniform sampler2D u_depth;
uniform sampler2D u_mattness;
uniform sampler2D u_normal;
uniform sampler2D u_saliencya;
uniform sampler2D u_saliencyo;
uniform sampler2D u_segmentation;

uniform int u_layerMode;

layout(location = 0) out vec4 fragColor;

in vec2 v_uv;

void main(void)
{
    if(u_layerMode == 0)
        fragColor = vec4(texture(u_original, v_uv).rgb, 1.0);
    if(u_layerMode == 1)
        fragColor = vec4(texture(u_depth, v_uv).rgb, 1.0);
    if(u_layerMode == 2)
        fragColor = vec4(texture(u_mattness, v_uv).rgb, 1.0);
    if(u_layerMode == 3)
        fragColor = vec4(texture(u_normal, v_uv).rgb, 1.0);
    if(u_layerMode == 4)
        fragColor = vec4(texture(u_saliencya, v_uv).rgb, 1.0);
    if(u_layerMode == 5)
        fragColor = vec4(texture(u_saliencyo, v_uv).rgb, 1.0);
    if(u_layerMode == 6)
        fragColor = vec4(texture(u_segmentation, v_uv).rgb, 1.0);
}
