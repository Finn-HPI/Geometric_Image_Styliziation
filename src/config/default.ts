export function defaultConfig(){
    let config = {
        input: [
          {
            "name": "depth",
            "value": "0.3"
          },
          {
            "name": "matting",
            "value": "0.3"
          },
          {
            "name": "saliencya",
            "value": "0.5"
          },
          {
            "name": "saliencyo",
            "value": "0.3"
          },
          {
            "name": "normal",
            "value": "0.3"
          },
          {
            "name": "normalx",
            "value": "0.5"
          },
          {
            "name": "normaly",
            "value": "0.25"
          },
          {
            "name": "normalz",
            "value": "-0.35"
          },
          {
            "name": "probability",
            "value": "0.3"
          },
          {
            "name": "minDist",
            "value": "4"
          },
          {
            "name": "maxTries",
            "value": "42"
          },
          {
            "name": "maxColorCount",
            "value": "64"
          }
        ],
        select: [
          {
            "name": "criteria",
            "value": "0"
          },
          {
            "name": "color",
            "value": "0"
          },
          {
            "name": "tree",
            "value": "1"
          },
          {
            "name": "sampleMode",
            "value": "1"
          }
        ],
        layers: [
          {
            "criteria": "Lod",
            "color": "Median",
            "tree": "Quad",
            "from": 0,
            "to": 255,
            "maxLevel": 15,
            "keep": false
          }
        ],
        seed: ''
      };
      return config;
}