import { Canvas } from "webgl-operate";
import { VPRenderer } from "./renderer/vpRenderer";

export function initializeRenderer(element: string | HTMLCanvasElement){
    let canvas = new Canvas(element, {preserveDrawingBuffer: true});
    canvas.renderer = new VPRenderer();
}
