import { TreeNode } from "../trees/node";
import { bytesToBase64 } from "../utils/base64";

export class GlTFBuilder {

    protected ARRAY_BUFFER = 34962;
    protected ELEMENT_ARRAY_BUFFER = 34963;
    protected FLOAT = 5126;
    protected UNSIGNED_SHORT = 5123;
    protected UNSIGNED_INT = 5125

    public preprocessAndBuild(
        indices: Array<number>, 
        vertices: Array<number>,
        colors: Array<number>,
        minIndex: number,
        maxIndex: number,
        minX: number,
        maxX: number,
        minY: number,
        maxY: number,
        minZ: number,
        maxZ: number,
        minRed: number,
        maxRed: number,
        minGreen: number,
        maxGreen: number,
        minBlue: number,
        maxBlue: number
    ){
        let paddingLength = 0;//(indices.length) % 4;
        let indices2 = new Uint32Array(indices.length + paddingLength);

        for(let i = 0; i < indices2.length; i++)
            indices2[i] = indices[i];

        let vertices2 = new Float32Array(vertices);
        let colors2 = new Float32Array(colors);

        let i = new Uint8Array(indices2.buffer);
        let v = new Uint8Array(vertices2.buffer);
        let c = new Uint8Array(colors2.buffer);
        let b = new Uint8Array(i.length + v.length + c.length);

        b.set(i);
        b.set(v, i.length);
        b.set(c, i.length + v.length);

        let encoded = "data:application/octet-stream;base64," + bytesToBase64(b);
        this.exportGlTF(
            encoded,
            indices2.length * 4,
            paddingLength,
            vertices.length * 4,
            colors.length * 4,
            indices.length,
            vertices.length / 3,
            colors.length / 3,
            minIndex, maxIndex, minX, maxX, minY, maxY, minZ, maxZ,
            minRed, maxRed, minGreen, maxGreen, minBlue, maxBlue
        );
    }

    public fromTree(tree: any, width: number, height: number){
        const earcut = require('earcut');

        let lastIndex = 0;
        let vertices = new Array<number>();
        let indices = new Array<number>();
        let colors = new Array<number>();

        tree.allTreeNodes(tree.root).forEach((each: TreeNode) => {

            if(each.path !== null){

                if(each.childPaths.length >= 1){

                    each.childPaths.forEach((child: paper.PathItem) => {
                        let poly = new Array<number>();
                        (child as paper.Path).segments.forEach((segment: paper.Segment) => {
                            let point = this.normalizePoint(segment.point.x, segment.point.y, width, height);
                            poly.push(point[0]);
                            poly.push(point[1]);
                            
                            vertices.push(point[0]);
                            vertices.push(point[1]);
                            vertices.push(1 - each.depth / 255);

                            colors.push(each.color.red);
                            colors.push(each.color.green);
                            colors.push(each.color.blue);
                        });
                        let polyIndices: Array<number> = earcut(poly);
                        for(let i = 0; i < polyIndices.length - 2; i++){
                            indices.push(polyIndices[i] + lastIndex);
                            indices.push(polyIndices[i + 1] + lastIndex);
                            indices.push(polyIndices[i + 2] + lastIndex);
                        }
                        lastIndex = vertices.length / 3;
                    });
                }else{
                    let poly = new Array<number>();
                    (each.path as paper.Path).segments.forEach((segment: paper.Segment) => {
                        let point = this.normalizePoint(segment.point.x, segment.point.y, width, height);
                        poly.push(point[0]);
                        poly.push(point[1]);
                        
                        vertices.push(point[0]);
                        vertices.push(point[1]);
                        vertices.push(1 - each.depth / 255);

                        colors.push(each.color.red);
                        colors.push(each.color.green);
                        colors.push(each.color.blue);
                    });
                    let polyIndices: Array<number> = earcut(poly);
                    for(let i = 0; i < polyIndices.length - 2; i++){
                        indices.push(polyIndices[i] + lastIndex);
                        indices.push(polyIndices[i + 1] + lastIndex);
                        indices.push(polyIndices[i + 2] + lastIndex);
                    }
                    lastIndex = vertices.length / 3;
                }
            }
        });

        let minIndex = indices[0];
        let maxIndex = indices[0];

        let minX = vertices[0];
        let maxX = vertices[0];

        let minY = vertices[1];
        let maxY = vertices[1];

        let minZ = vertices[2];
        let maxZ = vertices[2];

        let minRed = colors[0];
        let maxRed = colors[0];

        let minGreen = colors[1];
        let maxGreen = colors[1];

        let minBlue = colors[2];
        let maxBlue = colors[2];

        indices.forEach((index: number) => {
            if(index < minIndex)
                minIndex = index;
            if(index > maxIndex)
                maxIndex = index;
        });

        for(let i = 0; i < vertices.length -2; i += 3){
            if(vertices[i] < minX)
                minX = vertices[i];
            if(vertices[i+1] < minY)
                minY = vertices[i];
            if(vertices[i+2] < minZ)
                minZ = vertices[i+2];

            if(vertices[i] > maxX)
                maxX = vertices[i];
            if(vertices[i+1] > maxY)
                maxY = vertices[i];
            if(vertices[i+2] > maxZ)
                maxZ = vertices[i+2];

            if(colors[i] < minRed)
                minRed = colors[i];
            if(colors[i+1] < minGreen)
                minGreen = colors[i+1];
            if(colors[i+2] < minBlue)
                minBlue = colors[i+2];

            if(colors[i] > maxRed)
                maxRed = colors[i];
            if(colors[i+1] > maxGreen)
                maxGreen = colors[i+1];
            if(colors[i+2] > maxBlue)
                maxBlue = colors[i+2];
        }
        this.preprocessAndBuild(
            indices, vertices, colors,
            minIndex, maxIndex, 
            minX, maxX, minY, maxY, minZ, maxZ, 
            minRed, maxRed, minGreen, maxGreen, minBlue, maxBlue
        );
    }

    public normalizePoint(x: number, y: number, width: number, height: number){
        let center = [width / 2, height / 2];
        let point = [x - center[0], y - center[1]];
        point = [point[0] / width, -point[1] / height];

        return point;
    }

    public exportGlTF(
        uri: string, 
        byteLengthIndeces: number,
        paddingLength: number,
        byteLengthVertices: number,
        byteLengthColors: number,
        indexCount: number,
        vertexCount: number,
        colorCount: number,
        minIndex: number,
        maxIndex: number,
        minX: number,
        maxX: number,
        minY: number,
        maxY: number,
        minZ: number,
        maxZ: number,
        minRed: number,
        maxRed: number,
        minGreen: number,
        maxGreen: number,
        minBlue: number,
        maxBlue: number
    ){
        const gltf = {
            scenes: [ { nodes: [0] } ],
            nodes: [ { mesh: 0 }],
            meshes: [{
                primitives: [{
                    attributes: {
                        POSITION: 1,
                        COLOR_0: 2
                    },
                    indices: 0
                }]
            }],
            buffers: [
                {
                    uri: uri,
                    byteLength: byteLengthIndeces + paddingLength + byteLengthVertices + byteLengthColors
                }
            ],
            bufferViews: [
                {
                    buffer: 0,
                    byteOffset: 0,
                    byteLength: byteLengthIndeces,
                    target: this.ELEMENT_ARRAY_BUFFER
                },
                {
                    buffer: 0,
                    byteOffset: byteLengthIndeces + paddingLength,
                    byteLength: byteLengthVertices,
                    target: this.ARRAY_BUFFER
                },
                {
                    buffer: 0,
                    byteOffset: byteLengthIndeces + paddingLength + byteLengthVertices,
                    byteLength: byteLengthColors,
                    target: this.ARRAY_BUFFER
                }
            ],
            accessors: [
                {
                    bufferView: 0,
                    byteOffset: 0,
                    componentType: this.UNSIGNED_INT,
                    count: indexCount,
                    type: 'SCALAR',
                    max: [maxIndex],
                    min: [minIndex]
                },
                {
                    bufferView: 1,
                    byteOffset: 0,
                    componentType: this.FLOAT,
                    count: vertexCount,
                    type: 'VEC3',
                    max: [maxX, maxY, maxZ],
                    min: [minX, minY, minZ]
                },
                {
                    bufferView: 2,
                    byteOffset: 0,
                    componentType: this.FLOAT,
                    count: colorCount,
                    type: 'VEC3',
                    max: [maxRed, maxGreen, maxBlue],
                    min: [minRed, minGreen, minBlue]
                }
            ],
            asset: {
                version: '2.0'
            }
        };
        let link = document.createElement("a");
        link.download = 'test.gltf';
        link.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(gltf, null, 2));
        link.click();
    }

}