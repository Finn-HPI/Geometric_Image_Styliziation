precision highp float;

uniform sampler2D u_texture;
uniform float u_time;
uniform float u_prob;

in vec2 v_uv;

layout(location = 0) out vec4 fragColor;

uint hash( uint x ) {
    x += ( x << 10u );
    x ^= ( x >>  6u );
    x += ( x <<  3u );
    x ^= ( x >> 11u );
    x += ( x << 15u );
    return x;
}

uint hash(uvec3 v) { 
    return hash( v.x ^ hash(v.y) ^ hash(v.z)); 
}

float floatConstruct(uint m) {
    const uint ieeeMantissa = 0x007FFFFFu;
    const uint ieeeOne = 0x3F800000u;

    m &= ieeeMantissa;
    m |= ieeeOne;
    float  f = uintBitsToFloat(m);
    return f - 1.0;
}

float random(vec3  v){ 
    return floatConstruct(hash(floatBitsToUint(v))); 
}

void main()
{
    vec3 inputs = vec3(v_uv, u_time);
    float rand = random(inputs);
    float alpha = rand < u_prob? 1.0 : 0.0;
    fragColor = vec4(texture(u_texture, v_uv).rgb, alpha);
}