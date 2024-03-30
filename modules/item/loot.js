import * as THREE from 'three';
import { GetRenderManager } from '../display/render.js';
import { GetDistance, GetWorld } from '../world/world.js';
import { ItemMapping } from './potion.js';

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
        let map = null;
        if(type == "treasure") {
            map = new THREE.TextureLoader().load('sprite/DC_Treasure.png');
        }
        else {
            map = new THREE.TextureLoader().load('sprite/DC_Chest.png');
        }
        this.quantity = quantity;
        this.type = type;
        this.location = [location[0], location[1]];
        this.material = new THREE.SpriteMaterial({ 
            map: map
        });
        this.sprite = new THREE.Sprite(this.material);
        if(type == "treasure") {
            this.sprite.scale.set(0.6, 0.6, 0.6);
            this.sprite.position.set(this.location[0] + 0.3, 0, this.location[1] + 0.3);
        }
        else {
            this.sprite.scale.set(0.3, 0.3, 0.3);
            this.sprite.position.set(this.location[0] + 0.3, -0.4, this.location[1] + 0.3);
        }

        this.root.add(this.sprite);
        GetRenderManager().getScene().add(this.root);
    }

}

class LootManager {
    static INTERACT_THRESHOLD = 2.0;

    constructor() {
        this.list = [];
    }

    randomize() {
        let quantity = 1 + Math.floor(Math.random() * 3);
        let location = GetWorld().getMap().getRandomLocation();
        let mapping = ItemMapping;
        let keys = Object.keys(mapping);
        let done = false;
        let selected = "";
        while(!done) {
            selected = keys[Math.floor(Math.random() * keys.length)];
            if(selected != "treasure") {
                done = true;
            }
        }
        let type = new mapping[selected]().id();
        console.log("[loot-manager] Adding randomized loot: " + quantity + "x " + type + " @ " + location);
        this.add(quantity, type, location);
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