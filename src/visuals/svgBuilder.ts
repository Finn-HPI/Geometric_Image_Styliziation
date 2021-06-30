import { 
    Path,
    PaperScope,
    Point,
    Color,
    Rectangle,
    Size
} from 'paper';
import { BorderMode, ColorMode, Settings } from '../renderer/globalSettings';
import { KdNode } from '../trees/kd/kdNode';
import { QuadNode } from '../trees/quad/quadNode';
import { VPNode } from '../trees/vp/vpNode';
import { colorToGrayScale, colorToHex, getColorFromHex } from '../utils/colorUtil';
import { GlTFBuilder } from './gltfBuilder';
import { clipperLib, clipperOffset, clipperUnite, paperClipperSimplify } from 'paper-clipper';

export enum BuildModes {
    CIRCLE,
    REG_POLY
}

export enum DataStructure {
    VP,
    QUAD,
    KD
}

export class SVGBuilder{

    protected _tree!: any;
    protected _scope!: paper.PaperScope;

    protected _svg!: string;

    protected _maxLevel!: number;
    protected _maxUsedLevel!: number;
    protected _minUsedLevel!: number;
    protected _width!: number;
    protected _height!: number;
    protected _settings!: Settings;

    protected _background!: paper.PathItem;
    protected _backColor!: paper.Color;

    protected _mousePressed!: boolean;
    protected _buildMode!: BuildModes;
    protected _type!: DataStructure;

    protected _maxLod!: number;
    protected _colorGroups!: Map<string, Array<string>>;
    protected _clipper!: clipperLib.ClipperLibWrapper;

    private colorLerp(x: paper.Color, y: paper.Color, a: number){
        return x.multiply(1-a).add(y.multiply(a))
    }

    private lerp(x: number, y: number, a: number){
        return x * (1-a) + y * a;
    }

    public constructor(){
        this._scope = new PaperScope();
        this._backColor = new Color(0,0,0);
        this._background
        this._maxLevel = 15;
        this._maxUsedLevel = 0;
        this._minUsedLevel = -1;
        this._buildMode = BuildModes.CIRCLE;
        this._colorGroups = new Map<string, Array<string>>();

        //default BorderSettings
        this._settings = {
            colorMode: ColorMode.COLOR,
            borderMode: BorderMode.BORDER,
            border0: 0.3,
            border1: 0.3,
            color0: new Color(0,0,0),
            color1: new Color(0,0,0)
        };
    }

    public buildVP(node: VPNode, clip: paper.PathItem, level: number, clipPath: paper.PathItem): paper.PathItem | null{
        if(node == null || !node.point) 
            return null;

        if(level > this._maxUsedLevel)
            this._maxUsedLevel = level;
        if(level < this._minUsedLevel || this._minUsedLevel == -1)
            this._minUsedLevel = level;
        
        node.level = level;

        let intersect = clip.intersect(
            this.getShape(new Point(node.point.x, node.point.y), node.threshold, level)
        );

        let inside = intersect;
        let outside = clip.subtract(intersect);
        intersect.fillColor = node.color;

        node.path = intersect;

        let l: paper.PathItem | null = null;
        let r: paper.PathItem | null = null;

        if(node.left != null && node.left.lod / 255 > level / this._maxLevel)
            l = this.buildVP(node.left, inside, level + 1, clipPath);
        if(node.right != null && node.right.lod / 255 > level / this._maxLevel)
            r = this.buildVP(node.right, outside, level + 1, clipPath);

        if(l == null && r == null)
            return intersect;

        let path: paper.PathItem | null = null;

        if(l !== null && r !== null)
            path = l.unite(r);
        else if(l !== null)
            path = l;
        else if(r !== null)
            path = r;

        if(path !== null){
            node.path = node.path.subtract(path);
        }

        return path == null? null : path.unite(node.path);
    }

    public buildQuad(node: QuadNode, level: number, clipPath: paper.PathItem){
        if(node == null)
            return;

        if(level > this._maxUsedLevel)
            this._maxUsedLevel = level;

        node.level = level;

        let tl = false, tr = false, bl = false, br = false;
        if(node.topLeftChild != null && level * 255 / this._maxLevel < node.topLeftChild.lod)
            this.buildQuad(node.topLeftChild, level + 1, clipPath);
        else
            tl = true;
        if(node.topRightChild != null && level * 255 / this._maxLevel < node.topRightChild.lod)
            this.buildQuad(node.topRightChild, level + 1, clipPath);
        else
            tr = true;
        if(node.bottomLeftChild != null && level * 255 / this._maxLevel < node.bottomLeftChild.lod)
            this.buildQuad(node.bottomLeftChild, level + 1, clipPath);
        else
            bl = true;
        if(node.bottomRightChild != null && level * 255 / this._maxLevel < node.bottomRightChild.lod)
            this.buildQuad(node.bottomRightChild, level + 1, clipPath);
        else 
            br = true;

        if(tl || tr || bl || br){

            let rectangle = new Rectangle(
                new Point(node.topLeft.x, node.topLeft.y),
                new Point(node.bottomRight.x, node.bottomRight.y)
            );

            let q1 = new Path.Rectangle(
                rectangle.topLeft,
                rectangle.center
            );

            let q2 = new Path.Rectangle(
                rectangle.topCenter,
                rectangle.rightCenter
            );

            let q3 = new Path.Rectangle(
                rectangle.leftCenter,
                rectangle.bottomCenter
            );

            let q4 = new Path.Rectangle(
                rectangle.center,
                rectangle.bottomRight
            );

            let rect: paper.PathItem = new Path.Rectangle(rectangle);

            if(!tl)
                rect = rect.subtract(new Path.Rectangle(
                    rectangle.topLeft,
                    rectangle.center
                ));
            if(!tr)
                rect = rect.subtract(new Path.Rectangle(
                    rectangle.topCenter,
                    rectangle.rightCenter
                ));
            if(!bl)
                rect = rect.subtract(new Path.Rectangle(
                    rectangle.leftCenter,
                    rectangle.bottomCenter
                ));
            if(!br)
                rect = rect.subtract(new Path.Rectangle(
                    rectangle.center,
                    rectangle.bottomRight
                ));

            if(tl){
                q1.fillColor = node.color;
                node.addChild(q1);
            }
            if(tr){
                q2.fillColor = node.color;
                node.addChild(q2);
            }
            if(bl){
                q3.fillColor = node.color;
                node.addChild(q3);
            }
            if(br){
                q4.fillColor = node.color;
                node.addChild(q4);
            }

            if(level < this._minUsedLevel || this._minUsedLevel == -1)
                this._minUsedLevel = level;

            rect.fillColor = node.color;
            node.path = rect;
        }
    }

    public buildKd(node: KdNode, area: paper.Rectangle, level: number, clipPath: paper.PathItem){
        if(node == null || node.point == null)
            return;
            
        if(level > this._maxUsedLevel)
            this._maxUsedLevel = level;
        
        node.level = level;

        let left = new Rectangle(area.topLeft, (level % 2) == 0? new Point(node.point.x, area.bottom) : new Point(area.right, node.point.y));
        let right = new Rectangle((level % 2) == 0? new Point(node.point.x, area.top) : new Point(area.left, node.point.y), area.bottomRight);

        let l = false, r = false;
        let rect;
        if(node.left != null && level * 255 / this._maxLevel < node.left.lod)
            this.buildKd(node.left, left, level + 1, clipPath);
        else
            l = true;
        if(node.right != null && level * 255 / this._maxLevel < node.right.lod)
            this.buildKd(node.right, right,level + 1, clipPath);
        else    
            r = true;

        if(l && r)
            rect = new Path.Rectangle(area);
        else if(l)
            rect = new Path.Rectangle(left);
        else if(r)
            rect = new Path.Rectangle(right);
        
        if(rect !== undefined){
            if(level < this._minUsedLevel || this._minUsedLevel == -1)
                this._minUsedLevel = level;
            rect.fillColor = node.color;
            node.path = rect;
        }
    }

    private getShape(point: paper.Point, radius: number, level: number): paper.Path{
        switch(this._buildMode){
            case BuildModes.CIRCLE: 
                return new Path.Circle(point, radius);
            case BuildModes.REG_POLY:
                return new Path.RegularPolygon(point, 10, radius);
        }
    }

    public buildFrom(tree: any, width: number, height: number, type: DataStructure, maxLod: number = 255, maxLevel: number = 15, settings: Settings): void{
        this._scope = new PaperScope();
        this._scope.setup(new Size(width, height));
        this._scope.activate();
        this._maxLod = maxLod;
        this._width = width;
        this._height = height;
        this._tree = tree;
        this._type = type;

        this._maxUsedLevel = 0;
        this._maxLevel = maxLevel;
        this._settings = settings;

        this._background = new Path.Rectangle(new Rectangle(new Point(0, 0), new Size(width, height)));
        this._background.fillColor = new Color(0,0,0);

        if(this._tree.root == null) 
            return;
        this.buildTree(this._tree, type);
    }

    public exportToGltf(){
        if(this._tree !== undefined && this._tree){
            if(this._type == DataStructure.KD || this._type == DataStructure.QUAD)
                new GlTFBuilder().fromTree(this._tree, this._width, this._height);
        }
    }

    public buildTree(tree: any, type: DataStructure){
        if(tree.clipPath == undefined)
            tree.clipPath = this._background;

        // tree.clipPath = new Path.Circle(new Point(300,400), 250);
        // tree.fillColor = new Color(0,0,0);
        switch(type){
            case DataStructure.VP: this.buildVP(tree.root, this._background, 0, tree.clipPath);
                break;
            case DataStructure.QUAD: this.buildQuad(tree.root, 0, tree.clipPath);
                break;
            case DataStructure.KD: 
                this.buildKd(tree.root, new Rectangle(new Point(0,0), new Point(this._width, this._height)), 0, tree.clipPath);
        }
        console.log('finished build');
    }

    public displayOnCanvas(svg: string){
        let img = (document.getElementById(svg) as HTMLImageElement);
        img.src = this.generateCompleteSvg();
        img.width = this._width;
        img.height = this._height;
    }

    public clipMaskToSvg(): string{
        if(this._tree.root == null) 
            return '';
        return (this._tree.clipPath.exportSVG({asString: true}) as string).replace('xmlns="http://www.w3.org/2000/svg" ', '') + '\n';
    }


    public treeToSvg(){
        if(this._tree.root == null) 
            return;

        this._tree.allTreeNodes(this._tree.root).forEach((each: any) => {
            if(each.path !== null){
                each.maxLevel = this._maxUsedLevel;
                each.minLevel = this._minUsedLevel;
                let part = (each.path.exportSVG({asString: true}) as string).replace('xmlns="http://www.w3.org/2000/svg" ', '').replace(
                    ' stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"', 
                    ''
                ).replace('  ', ' ');
                part = '\t' + part.slice(0, part.length-2) 
                    + ' depth="' + each.point?.depth 
                    + '" segment="' + each.point?.segment
                    + '" matting="' + each.point?.matting
                    + '" saliency-a="' + each.point?.saliencyA
                    + '" saliency-o="' + each.point?.saliencyO
                    + '" level="' + each.level
                    + '" min-level="' + each.minLevel
                    + '" max-level="' + each.maxLevel
                    + '"/>\n';
                let path = part.match(/path d="([^"]*)"/);
                if(path && path[1] == '')
                    return;
                let regex = part.match(/(fill="#[^"]*"\sfill-rule="nonzero")/);
                if(regex){
                    part = part.replace(' ' + regex[0] + ' ', ' ');
                    let color = regex[1];
                    if(this._colorGroups.get(color) !== undefined)
                        (this._colorGroups.get(color) as Array<string>).push(part);
                    else
                        this._colorGroups.set(color, [part]);
                }
            }
        });
    }

    public applyNewBorderSettings(settings: Settings){
        this._settings = settings;
        this._colorGroups.forEach((parts: Array<string>, color: string) => {
            for(let i = 0; i < parts.length; i++){
                let part = parts[i];
                let strokeRegex = part.match(/stroke="([^"]*)"\sstroke-width="([^"]*)"/);
                let levelRegex = part.match(/level="([^"]*)"\smin-level="([^"]*)"\smax-level="([^"]*)"/);
                let colorRegex = part.match(/fill="([^"]*)"/);
                let originalColorRegex = color.match(/fill="([^"]*)"/);

                if(strokeRegex && strokeRegex.length >= 3 && levelRegex && levelRegex.length >= 4){
                    let stroke = strokeRegex[1];
                    let strokeWidth = strokeRegex[2];
                    let level = Number(levelRegex[1]);
                    let minLevel = Number(levelRegex[2])
                    let maxLevel = Number(levelRegex[3]);

                    let a = (level - minLevel) / (maxLevel - minLevel);
                    let newStrokeWidth = this.lerp(settings.border0, settings.border1, a).toString();

                    let updated = strokeRegex[0].replace('stroke="' + stroke + '"', 'stroke="' + this.borderModeToAttributeValue(settings, a, color) + '"');
                    updated = updated.replace('stroke-width="' + strokeWidth + '"', 'stroke-width="' + newStrokeWidth + '"');

                    if(colorRegex && colorRegex.length >= 2){
                        if(settings.borderMode == BorderMode.FILL || settings.borderMode == BorderMode.FILL_AND_BORDER){
                            if(settings.colorMode == ColorMode.GRAY_SCALE && originalColorRegex){
                                let newColor = colorToHex(colorToGrayScale(getColorFromHex(originalColorRegex[1])));
                                parts[i] = parts[i].replace(colorRegex[1], newColor);
                            }else{
                                parts[i] = parts[i].replace(' ' + colorRegex[0], '');
                            }
                        }else{
                            parts[i] = parts[i].replace(colorRegex[0], 'fill="none"');
                        }
                    }else if(settings.borderMode == BorderMode.BORDER || settings.borderMode == BorderMode.WIREFRAME)
                        updated += ' fill="none"';
                    else if(settings.colorMode == ColorMode.GRAY_SCALE && originalColorRegex){
                        let newColor = colorToHex(colorToGrayScale(getColorFromHex(originalColorRegex[1])));
                        updated += ' fill="' + newColor + '"';
                    }
                    parts[i] = parts[i].replace(strokeRegex[0], updated);
                }
            }
        });
    }

    private borderModeToAttributeValue(settings: Settings, a: number, nodeColor: string){
        switch(settings.borderMode){
            case BorderMode.WIREFRAME:
                let colorRegex = nodeColor.match(/fill="(#[^"]*)"\sfill-rule="nonzero"/);
                if(colorRegex)
                    return colorRegex[1];
                break;
            case BorderMode.FILL:
                return 'none';
        }
        let color = this.colorLerp(settings.color0, settings.color1, a);
        return colorToHex(color);
    }

    private generateCompleteSvg(): string{
        let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + this._width + '" height="' + this._height + '">\n';
        this._colorGroups.forEach((parts2: Array<string>, color: string) => {
            if(parts2.length > 0){
                svg += '<g ' + color + '>\n';
                parts2.forEach((part: string) => {
                    svg += part;
                })
                svg += '</g>\n';
            }
        });
        svg += '</svg>';
        let url = "data:image/svg+xml;utf8," + encodeURIComponent(svg);
        return url;
    }

    public reset(){
        this._colorGroups = new Map<string, Array<string>>();
    }

    public export(fileName: string){

        let link = document.createElement("a");
        link.download = fileName;
        link.href = this.generateCompleteSvg();;
        link.click();
    }

    public get isMousePressed(){
        return this._mousePressed;
    }

    public set mousePressed(pressed: boolean){
        this._mousePressed = pressed;
    }

    public get maxLevel(){
        return this._maxLevel;
    }

    public set maxLevel(level: number){
        this._maxLevel = level;
    }

    public get buildMode(){
        return this._buildMode;
    }

    public set buildMode(shape: BuildModes){
        this._buildMode = shape;
    }
}