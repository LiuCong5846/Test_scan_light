
const {ccclass, property} = cc._decorator;

enum EMaterialPropertyName {
    LIGHT_CENTER_POINT = "lightCenterPoint",
    LIGHT_COLOR = "lightColor",
    LIGHT_ANGLE = "lightAngle",
    LIGHT_WIDTH = "lightWidth",
    ENABLE_GRADIENT = "enableGradient",
    CROP_ALPHA = "cropAlpha",
    CROP_NOT_LIGHT = "cropNotLight",
    ENABLE_MIX_COLOR = "enableMixColor",
}

@ccclass
export default class ScanLightTest extends cc.Component {
    @property({
        type: cc.Node,
        tooltip: "根节点",
    })
    private rootNode: cc.Node = null;

    @property({
        type: cc.Node,
        tooltip: "扫光节点",
    })
    private lightNode: cc.Node = null;

    @property({
        type: cc.SpriteFrame,
        tooltip: "被添加扫光效果的纹理",
    })
    get spriteFrameRes() {
        return this._spriteFrameRes;
    }
    set spriteFrameRes(res: cc.SpriteFrame) {
        this._spriteFrameRes = res;
        if (CC_EDITOR) {
            this.setSpriteFrameRes();
        }
    }
    @property
    private _spriteFrameRes: cc.SpriteFrame = null;

    @property({
        type: cc.Color,
        tooltip: "光束颜色",
    })
    get lightColor() {
        return this._lightColor;
    }
    set lightColor(colorVal: cc.Color) {
        this._lightColor = colorVal;
        if (CC_EDITOR) {
            this.onPropertyChanged(EMaterialPropertyName.LIGHT_COLOR);
        }
    }
    @property
    private _lightColor: cc.Color = cc.color(255, 255, 255, 255);

    @property({
        type: cc.Float,
        range: [0, 90, 0.1],
        slide: true,
        tooltip: "光束旋转角度, 范围0-90度"
    })
    get lightAngle() {
        return this._lightAngle;
    }
    set lightAngle(angleVal: number) {
        this._lightAngle = angleVal;
        if (CC_EDITOR) {
            this.onPropertyChanged(EMaterialPropertyName.LIGHT_ANGLE);
        }
    }
    @property
    private _lightAngle: number = 36;

    @property({
        type: cc.Float,
        range: [0, 1, 0.1],
        slide: true,
        tooltip: "光束宽度, 范围0-1",
    })
    get lightWidth() {
        return this._lightWidth;
    }
    set lightWidth(widthVal: number) {
        this._lightWidth = widthVal;
        if (CC_EDITOR) {
            this.onPropertyChanged(EMaterialPropertyName.LIGHT_WIDTH);
        }
    }
    @property
    private _lightWidth: number = 0.2;

    @property({
        type: cc.Boolean,
        tooltip: "是否纵向镜像角度"
    })
    get isAngleFlip() {
        return this._isAngleFlip;
    }
    set isAngleFlip(flag: boolean) {
        this._isAngleFlip = flag;
        if (CC_EDITOR) {
            this.onPropertyChanged(EMaterialPropertyName.LIGHT_ANGLE);
        }
    }
    @property
    private _isAngleFlip: boolean = false;

    @property({
        type: cc.Boolean,
        tooltip: "启用光束渐变",
    })
    get enableGradient() {
        return this._enableGradient;
    }
    set enableGradient(flag: boolean) {
        this._enableGradient = flag;
        if (CC_EDITOR) {
            this.onPropertyChanged(EMaterialPropertyName.ENABLE_GRADIENT);
        }
    }
    @property
    private _enableGradient: boolean = true;

    @property({
        type: cc.Boolean,
        tooltip: "裁剪透明区域的光",
    })
    get cropAlpha() {
        return this._cropAlpha;
    }
    set cropAlpha(flag: boolean) {
        this._cropAlpha = flag;
        if (CC_EDITOR) {
            this.onPropertyChanged(EMaterialPropertyName.CROP_ALPHA);
        }
    }
    @property
    private _cropAlpha: boolean = true;

    @property({
        type: cc.Boolean,
        tooltip: "裁剪非光束区域",
    })
    get cropNotLight() {
        return this._cropNotLight;
    }
    set cropNotLight(flag: boolean) {
        this._cropNotLight = flag;
        if (CC_EDITOR) {
            this.onPropertyChanged(EMaterialPropertyName.CROP_NOT_LIGHT);
        }
    }
    @property
    private _cropNotLight: boolean = true;

    @property({
        type: cc.Boolean,
        tooltip: "开启混合色",
    })
    get enableMixColor() {
        return this._enableMixColor;
    }
    set enableMixColor(flag: boolean) {
        this._enableMixColor = flag;
        if (CC_EDITOR) {
            this.onPropertyChanged(EMaterialPropertyName.ENABLE_MIX_COLOR);
        }
    }
    @property
    private _enableMixColor: boolean = false;

    @property({
        tooltip: "是否逆向\n\t正向: 左 -> 右 & 上 -> 下\n\t逆向: 右 -> 左 & 下 -> 上"
    })
    private isOppositeDir: boolean = false;

    @property({
        type: cc.Float,
        tooltip: "扫光时长, 单位: s (限定最少 1s)",
    })
    get scanTime() {
        return this._scanTime;
    }
    set scanTime(val: number) {
        this._scanTime = val <= 0 ? 1 : val;
    }
    @property
    private _scanTime: number = 1.0;

    @property({
        type: cc.Float,
        tooltip: "间隔时长, 单位: s (限定最少 0s)",
    })
    get marginTime() {
        return this._marginTime;
    }
    set marginTime(val: number) {
        this._marginTime = val <= 0 ? 0 : val;
    }
    @property
    private _marginTime: number = 0.0;
 
    private _lightCenterPoint: cc.Vec2 = cc.Vec2.ZERO;

    private _lightTimeHelper: number = 0;

    private _wOffsetLength: number = 0;
    private _hOffsetLength: number = 0;
    private _lightOriginalPoint: cc.Vec2 = cc.Vec2.ZERO;

    protected onLoad(): void {
        cc.dynamicAtlasManager.enabled = false;

        const needFrameRates = (this._scanTime * cc.game.getFrameRate());
        if (this._lightAngle === 0) {
            this._wOffsetLength = 0;
            this._hOffsetLength = 1 / needFrameRates;
        } else if (this._lightAngle === 90) {
            this._wOffsetLength = 1 / needFrameRates;
            this._hOffsetLength = 0;
        } else {
            const unit = Math.sqrt(2) / needFrameRates;
            const angleInRadians = this._lightAngle * (180 / Math.PI);
            this._wOffsetLength = Math.abs(Math.cos(angleInRadians) * unit);
            this._hOffsetLength = Math.abs(Math.sin(angleInRadians) * unit);
        }

        if (this._lightAngle === 0) {
            this._lightOriginalPoint = this.isOppositeDir ? cc.v2(0.5, 1) : cc.v2(0.5, 0);
        } else if (this.lightAngle === 90) {
            this._lightOriginalPoint = this.isOppositeDir ? cc.v2(1, 0.5) : cc.v2(0, 0.5);
        } else {
            if (this._isAngleFlip) {
                this._lightOriginalPoint = this.isOppositeDir ? cc.v2(1, 0) : cc.v2(0, 1);
            } else {
                this._lightOriginalPoint = this.isOppositeDir ? cc.v2(1, 1) : cc.v2(0, 0);
            }
        }
    }

    protected onEnable(): void {
        this.resetLightCenterPoint();
        this.onPropertyChanged(EMaterialPropertyName.LIGHT_CENTER_POINT);
        this.onPropertyChanged(EMaterialPropertyName.LIGHT_COLOR);
        this.onPropertyChanged(EMaterialPropertyName.LIGHT_ANGLE);
        this.onPropertyChanged(EMaterialPropertyName.LIGHT_WIDTH);
        this.onPropertyChanged(EMaterialPropertyName.ENABLE_GRADIENT);
        this.onPropertyChanged(EMaterialPropertyName.CROP_ALPHA);
        this.onPropertyChanged(EMaterialPropertyName.CROP_NOT_LIGHT);
        this.onPropertyChanged(EMaterialPropertyName.ENABLE_MIX_COLOR);

        this.unschedule(this.onLightCenterPointChanged);
        this.schedule(this.onLightCenterPointChanged, 1 / cc.game.getFrameRate(), cc.macro.REPEAT_FOREVER, 0);
    }

    protected onDisable(): void {
        this.unschedule(this.onLightCenterPointChanged);
    }

    private resetLightCenterPoint() {
        this._lightCenterPoint = this._lightOriginalPoint;
        this._lightTimeHelper = Date.now();
    }



    private setSpriteFrameRes() {
        if (this._spriteFrameRes) {
            this.rootNode.getComponent(cc.Sprite) && (this.rootNode.getComponent(cc.Sprite).spriteFrame = this._spriteFrameRes);
            this.lightNode.getComponent(cc.Sprite) && (this.lightNode.getComponent(cc.Sprite).spriteFrame = this._spriteFrameRes);
        }
    }

    private getMaterial() {
        const lightSprite: cc.Sprite = this.lightNode.getComponent(cc.Sprite);
        if (!lightSprite) {
            cc.warn("lightNode has`t Sprite");
            return null;
        }
        const material: cc.Material = lightSprite.getMaterial(0);
        if (!material) {
            cc.warn("lightSprite has`t Material");
            return null;
        }

        return material;
    }

    private onLightCenterPointChanged() {
        // if (this._lightCenterPoint.sub(this._lightOriginalPoint).mag() >= Math.sqrt(2)) {
        //     this.resetLightCenterPoint();
        //     return;
        // } // 算法有问题
        const currentTime = Date.now();
        const time1 = this._lightTimeHelper + (this._scanTime + this.marginTime) * 1000;
        if (time1 < currentTime) { // 这样也有问题
            this.resetLightCenterPoint();
            return;
        }
        
        if (this._lightAngle === 0 || this._lightAngle === 90) {
            this._lightCenterPoint = this._lightCenterPoint.add(cc.v2(
                this.isOppositeDir ? - this._wOffsetLength : this._wOffsetLength,
                this.isOppositeDir ? - this._hOffsetLength : this._hOffsetLength,
            ));
        } else {
            if (this._isAngleFlip) {
                this._lightCenterPoint = this._lightCenterPoint.add(cc.v2(
                    this.isOppositeDir ? - this._wOffsetLength : this._wOffsetLength,
                    this.isOppositeDir ? this._hOffsetLength : - this._hOffsetLength,
                ));
            } else {
                this._lightCenterPoint = this._lightCenterPoint.add(cc.v2(
                    this.isOppositeDir ? - this._wOffsetLength : this._wOffsetLength,
                    this.isOppositeDir ? - this._hOffsetLength : this._hOffsetLength,
                ));
            }
        }
        this.onPropertyChanged(EMaterialPropertyName.LIGHT_CENTER_POINT);
        console.log(this._lightCenterPoint);
    }

    private onPropertyChanged(propertyName: EMaterialPropertyName) {
        const material = this.getMaterial();
        if (!material) {
            return;
        }
        let propertyVal: any = null;
        switch (propertyName) {
            case EMaterialPropertyName.LIGHT_CENTER_POINT:
                propertyVal = this._lightCenterPoint;
                break;
            case EMaterialPropertyName.LIGHT_COLOR:
                propertyVal = this._lightColor;
                break;
            case EMaterialPropertyName.LIGHT_ANGLE:
                propertyVal = this._isAngleFlip ? 180 -  this._lightAngle : this._lightAngle;
                break;
            case EMaterialPropertyName.LIGHT_WIDTH:
                propertyVal = this._lightWidth;
                break;
            case EMaterialPropertyName.ENABLE_GRADIENT:
                propertyVal = this._enableGradient ? 1.0 : 0.0;
                break;
            case EMaterialPropertyName.CROP_ALPHA:
                propertyVal = this._cropAlpha ? 1.0 : 0.0;
                break;
            case EMaterialPropertyName.CROP_NOT_LIGHT:
                propertyVal =  this._cropNotLight ? 1.0 : 0.0;
                break;
            case EMaterialPropertyName.ENABLE_MIX_COLOR:
                propertyVal = this._enableMixColor ? 1.0 : 0.0;
                break;
            default:
                break;
        }
        material.setProperty(propertyName as string, propertyVal);
    }
}
