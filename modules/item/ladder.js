import * as THREE from 'three';
import { GetRenderManager } from "../display/render.js";
import { GetWorld } from "../world/world.js";

class Ladder {
    constructor() {
        this.material = null;
        this.sprite = null;
        this.root = new THREE.Object3D();
    }

    create(location) {
        let world = GetWorld();
        let render = GetRenderManager();
        let map = new THREE.TextureLoader().load('sprite/DC_Ladder.png');
        this.location = [location[0], location[1]];
        this.material = new THREE.SpriteMaterial({ 
            map: map
        });
        this.sprite = new THREE.Sprite(this.material);
        this.sprite.scale.set(1.0, 1.0, 1.0);
        this.sprite.position.set(this.location[0] + 0.1, 0, this.location[1] + 0.1);
        this.root.add(this.sprite);
        render.getScene().add(this.root);
        console.log("[ladder] Creating ladder at " + location[0] + ", " + location[1]);
    }
}

export {Ladder}
