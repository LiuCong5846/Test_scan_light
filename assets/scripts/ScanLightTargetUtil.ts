
const {ccclass, property} = cc._decorator;

@ccclass
export default class ScanLightTargetUtil extends cc.Component {
    protected onLoad(): void {
        const spriteFrame = this.node.getComponent(cc.Sprite).spriteFrame;
        const material = this.node.getComponent(cc.Sprite).getMaterial(0);
        material.setProperty("flowUVOffset", new cc.Vec4(
            // @ts-ignore
            spriteFrame.uv[0],
            // @ts-ignore
            spriteFrame.uv[5],
            // @ts-ignore
            spriteFrame.uv[6],
            // @ts-ignore
            spriteFrame.uv[3],
        ));
        material.setProperty("flowUVRotated", spriteFrame.isRotated() ? 1.0 : 0.0);
    }
}
