import * as THREE from 'three';
import { GetRenderManager } from "../display/render.js";
import { GetAudioManager } from '/modules/world/audio.js';
import { GetPlayer } from './player.js';
import { GetWorld } from '../world/world.js';
import { WriteLog } from '../display/show.js';
import { RollD20, RollD } from '../utility/random.js';

class EnemyEvilEye {
    constructor() {
        this.renderInit = true;
        this.root = new THREE.Object3D();
        this.location = [3, 12];
        this.moveRate = 4;       // move once per X ticks
        this.moveLast = 0;
        this.dexterity = 5;
        this.strength = 15;
        this.isDying = false;
        this.isDead = false;
        this.hp = 40;
        this.hpMax = 40;
    }

    modifyHP(value) {
        this.hp += value;
        if(this.hp <= 0) {
            this.hp = 0;
            this.isDying = true;
            WriteLog("An evil eye has begun to die.");
            var self = this;
            setTimeout(function timeout() {
                self.sprite.material.opacity -= 0.08;
                if(self.sprite.material.opacity < 0.16) {
                    this.isDead = true;
                    while(self.root.children.length > 0){ 
                        self.root.remove(self.root.children[0]); 
                    }
                    self.material.dispose();
                }
                else {
                    setTimeout(timeout, 100);
                }
            }, 100);
        }
        if(this.hp >= this.hpMax) {
            this.hp = this.hpMax;
        }
    }

    combatRound(player) {
        if(this.isDead || this.isDying) {
            return;
        }
        player.addCombatTarget(this);
        let audio = GetAudioManager();
        let roll = RollD(1, 20);
        WriteLog("An evil eye rolls 1d20 :: " + roll + "!");
        let dexDiff = player.dexterity - this.dexterity;
        dexDiff = (dexDiff <= 10) ? dexDiff : 10;
        if(roll > dexDiff) {
            let damage = RollD(1, this.strength);
            player.modifyHP(-1 * damage);
            WriteLog("An evil eye deals " + damage + " HP of damage.");
            audio.playSound('Hurt');
        }
        else {
            WriteLog("The evil eye misses its attack.");
        }
    }

    tick() {
        if(this.isDying) {
            return;
        }
        let player = GetPlayer();
        let world = GetWorld();
        let map = world.getMap();
        ++this.moveLast;
        if(this.moveLast >= this.moveRate) {
            let path = map.findPath(this.location, player.getLocation());
            if(path.length < 1) {
                console.log("[EvilEye] No path to player ...");
            }
            else if(path.length == 2) {
                if(!player.isInCombat()) {
                    console.log("[EvilEye] Initiating combat ...");
                    player.addCombatTarget(this);
                    player.setInCombat(true, this);
                }
                else {
                    this.combatRound(player);
                }
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
        this.material = new THREE.SpriteMaterial({ 
            map: map, 
            transparent: true 
        });
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
