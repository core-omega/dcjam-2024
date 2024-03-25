import * as THREE from 'three';
import { GetRenderManager } from "../display/render.js";
import { GetPlayer } from './player.js';
import { GetWorld } from '../world/world.js';

class EnemyEvilEye {
    constructor() {
        this.renderInit = true;
        this.root = new THREE.Object3D();
        this.location = [3, 12];
        this.moveRate = 4;       // move once per X ticks
        this.moveLast = 0;
    }

    tick() {
        let player = GetPlayer();
        let world = GetWorld();
        let map = world.getMap();
        ++this.moveLast;
        if(this.moveLast >= this.moveRate) {
            let path = map.findPath(this.location, player.getLocation());
            if(path.length < 1) {
                console.log("[EvilEye] No path to player ...");
            }
            else if(path.length == 1) {
                // console.log("[EvilEye] Collision with player.");
            }
            else {
                // console.log("[EvilEye] Tracking player to: " + path[1][0] + ", " + path[1][1]);
                this.location = [path[1][0], path[1][1]];
                this.sprite.position.set(this.location[0] + 0.1, 0, this.location[1] + 0.1);
            }
            this.moveLast = 0;
        }
    }

    name() {
        return "Evil Eye";
    }

    init() {
        const map = new THREE.TextureLoader().load( 'sprite/DC_Eye.png' );
        this.material = new THREE.SpriteMaterial( { map: map } );
        this.sprite = new THREE.Sprite( this.material );
        this.sprite.position.set(this.location[0] + 0.1, 0, this.location[1] + 0.1);
        let render = GetRenderManager();
        this.root.add(this.sprite);
        render.getScene().add(this.root);
        this.renderInit = false;
    }

    render() {
        if(this.renderInit) {
            this.init();
        }
    }
}

export {EnemyEvilEye}
