import * as THREE from 'three';
import { GetRenderManager } from '../display/render.js';
import { GetDistance } from '../world/world.js';

class LootEntry {
    constructor() {
        this.quantity = -1;
        this.itemid = null;
        this.location = [0, 0];
        this.material = null;
        this.sprite = null;
        this.root = new THREE.Object3D();
    }

    remove() {
        while(this.root.children.length > 0){ 
            this.root.remove(this.root.children[0]); 
        }
        this.material.dispose();
        GetRenderManager().getScene().remove(this.root);
    }

    create(quantity, type, location) {
        const map = new THREE.TextureLoader().load( 'sprite/DC_Chest.png' );
        this.quantity = quantity;
        this.type = type;
        this.location = [location[0], location[1]];
        this.material = new THREE.SpriteMaterial({ 
            map: map
        });
        this.sprite = new THREE.Sprite(this.material);
        this.sprite.scale.set(0.2, 0.2, 0.2);
        this.sprite.position.set(this.location[0] + 0.3, -0.6, this.location[1] + 0.3);
        this.root.add(this.sprite);
        console.log(this.root);
        GetRenderManager().getScene().add(this.root);
    }
}

class LootManager {
    static INTERACT_THRESHOLD = 1.0;

    constructor() {
        this.list = [];
    }

    add(quantity, type, location) {
        let entry = new LootEntry();
        entry.create(quantity, type, location);

        this.list.push(entry);
    }

    find(location) {
        for(var i = 0; i < this.list.length; ++i) {
            if(GetDistance(location, this.list[i].location) <= LootManager.INTERACT_THRESHOLD) {
                return this.list[i];
            }
        }
        return null;
    }

    take(item) {
        for(var i = 0; i < this.list.length; ++i) {
            if(this.list[i] == item) {
                this.list[i].remove();
                this.list.splice(i, 1);
            }
        }
    }
}

let lootManager = new LootManager();

function GetLootManager() {
    return lootManager;
}

export {GetLootManager}