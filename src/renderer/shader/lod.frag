precision highp float;

uniform sampler2D u_original;
uniform sampler2D u_depth;
uniform sampler2D u_mattness;
uniform sampler2D u_normal;
uniform sampler2D u_saliencya;
uniform sampler2D u_saliencyo;
uniform sampler2D u_segmentation;

uniform float[8] u_configuration;
uniform int u_lodMode;

layout(location = 0) out vec4 fragColor;

in vec2 v_uv;

float angle(vec3 v1, vec3 v2){
    return dot(normalize(v1), normalize(v2));
}

void main(void)
{
    vec3 combination = u_configuration[0] * vec3(texture(u_depth, v_uv).r) 
        + u_configuration[1] * vec3(texture(u_mattness, v_uv).r)
        + u_configuration[2] * texture(u_saliencya, v_uv).rgb 
        + u_configuration[3] * texture(u_saliencyo, v_uv).rgb;
        
    vec3 normal = vec3(u_configuration[5], u_configuration[6], u_configuration[7]);
    if(length(normal) > 0.0){
        float a = angle(texture(u_normal, v_uv).rgb * 2.0 - 1.0, normal * 2.0 - 1.0);
        combination += vec3(a * u_configuration[4]);
    }

    combination = clamp(combination.rgb, 0.0, 1.0);
    if(u_lodMode == 1)
        combination *= texture(u_original, v_uv).rgb;
    fragColor = vec4(combination, 1.);
}
