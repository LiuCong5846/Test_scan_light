

const {ccclass, property} = cc._decorator;

@ccclass
export default class ScanLightScene extends cc.Component {
    protected onLoad(): void {
        cc.dynamicAtlasManager.enabled = false;
    }
}
