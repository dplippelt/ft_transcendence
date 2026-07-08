import { Scene } from "phaser";
import CardBase from "./CardBase";

export default class NumberCard extends CardBase {

    constructor(scene: Scene, private num: number) {

        super(scene, num.toString());
        
        this.setValue(num);
        // this.setDataEnabled();
        // this.setData('number', num);

	};

}
