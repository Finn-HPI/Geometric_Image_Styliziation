import Jimp from "jimp";
import { Tensor, InferenceSession } from "onnxjs";

export class ModelRunner {

    protected _session!: InferenceSession;
    
    public constructor(){
        this._session = new InferenceSession({backendHint: "webgl"});
        console.log(this._session);
    }

    public inputImage(img: Jimp){        
        console.log('imput new image');
        const inputs = this.preprocess(img);
        this.inputToModel(inputs);
    }

    public async inputToModel(inputs: Tensor[], url = 'models/AbstractBird_arch_new.onnx'){
        await this._session.loadModel(url);
        const outputMap = await this._session.run(inputs);
        const outputTensor = outputMap.values().next().value;
        
        console.log(outputTensor);
    }

    public preprocess(img: Jimp){
        img = img.cover(512, 512);
        let data = new Float32Array(img.bitmap.data.filter((v, i) => i % 4 !== 3)).slice(0, 512 * 512 * 3);
        console.log(data);
        const inputs = [
            new Tensor(data, 'float32', [1, 3, 512, 512])
        ];
        console.log('length: ', data.length);
        return inputs;
    }


}