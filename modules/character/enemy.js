import * as THREE from 'three';
import { GetRenderManager } from "../display/render.js";
import { GetAudioManager } from '/modules/world/audio.js';
import { GetPlayer } from './player.js';
import { GetWorld } from '../world/world.js';
import { WriteLog } from '../display/show.js';
import { RollD } from '../utility/random.js';
import { GetLootManager } from '../item/loot.js';

class EnemyEvilEye {
    constructor() {
        this.renderInit = true;
        this.root = new THREE.Object3D();
        this.location = [3, 12];
        this.moveRate = 4;       // move once per X ticks
        this.moveLast = 0;
        this.dexterity = 5;
        this.strength = 8;
        this.isDying = false;
        this.isDead = false;
        this.hp = 40;
        this.hpMax = 40;
    }

    executeDeath() {
        this.isDead = true;
        while(this.root.children.length > 0){ 
            this.root.remove(this.root.children[0]); 
        }
        this.material.dispose();
        GetRenderManager().getScene().remove(this.root);
        let loot = GetLootManager();
        let roll = Math.random();
        if(roll < 0.2) {
            loot.add(1, "lesserhealing", [this.location[0], this.location[1]]);
        }
        else if(roll < 0.4) {
            loot.add(1, "lesserstamina", [this.location[0], this.location[1]]);
        }
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
                    self.executeDeath();
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
        if(player.isDead) {
            return;
        }
        let world = GetWorld();
        let map = world.getMap();
        ++this.moveLast;
        if(this.moveLast >= this.moveRate) {
            let path = map.findPath(this.location, player.getLocation());
            if(path.length < 1) {
                console.log("[EvilEye] No path to player ...");
            }
            else if(path.length > 9) {
                let roll = Math.random();
                if(roll < 0.25) {
                    if(map.canMove([this.location[0] + 1, this.location[1]])) {
                        this.location = [this.location[0] + 1, this.location[1]];
                    }
                }
                else if(roll < 0.5) {
                    if(map.canMove([this.location[0] - 1, this.location[1]])) {
                        this.location = [this.location[0] - 1, this.location[1]];
                    }
                }
                else if(roll < 0.75) {
                    if(map.canMove([this.location[0], this.location[1] + 1])) {
                        this.location = [this.location[0], this.location[1] + 1];
                    }
                }
                else {
                    if(map.canMove([this.location[0], this.location[1] - 1])) {
                        this.location = [this.location[0], this.location[1] - 1];
                    }
                }
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
            else if(path.length == 1) {
                if(map.canMove([this.location[0] + 1, this.location[1]])) {
                    this.location = [this.location[0] + 1, this.location[1]];
                }
                else if(map.canMove([this.location[0] - 1, this.location[1]])) {
                    this.location = [this.location[0] - 1, this.location[1]];
                }
                else if(map.canMove([this.location[0], this.location[1] + 1])) {
                    this.location = [this.location[0], this.location[1] + 1];
                }
                else if(map.canMove([this.location[0], this.location[1] - 1])) {
                    this.location = [this.location[0], this.location[1] - 1];
                }
            }
            else {
                // console.log("[EvilEye] Tracking player to: " + path[1][0] + ", " + path[1][1]);
                this.location = [path[1][0], path[1][1]];
            }
            this.sprite.position.set(this.location[0] + 0.1, 0, this.location[1] + 0.1);
            this.moveLast = 0;
        }
    }

    id() {
        return "evileye";
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

class EnemySnake {
    constructor() {
        this.renderInit = true;
        this.root = new THREE.Object3D();
        this.location = [3, 12];
        this.moveRate = 3;       // move once per X ticks
        this.moveLast = 0;
        this.dexterity = 15;
        this.strength = 15;
        this.isDying = false;
        this.isDead = false;
        this.hp = 60;
        this.hpMax = 60;
    }

    executeDeath() {
        this.isDead = true;
        while(this.root.children.length > 0){ 
            this.root.remove(this.root.children[0]); 
        }
        this.material.dispose();
        GetRenderManager().getScene().remove(this.root);
        let loot = GetLootManager();
        let roll = Math.random();
        if(roll < 0.25) {
            loot.add(1, "lesserhealing", [this.location[0], this.location[1]]);
        }
        else if(roll < 0.5) {
            loot.add(1, "lesserstamina", [this.location[0], this.location[1]]);
        }
    }

    modifyHP(value) {
        this.hp += value;
        if(this.hp <= 0) {
            this.hp = 0;
            this.isDying = true;
            WriteLog("A snake has begun to die.");
            var self = this;
            setTimeout(function timeout() {
                self.sprite.material.opacity -= 0.08;
                if(self.sprite.material.opacity < 0.16) {
                    self.executeDeath();
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
        WriteLog("A snake rolls 1d20 :: " + roll + "!");
        let dexDiff = player.dexterity - this.dexterity;
        dexDiff = (dexDiff <= 10) ? dexDiff : 10;
        if(roll > dexDiff) {
            let damage = RollD(1, this.strength);
            player.modifyHP(-1 * damage);
            WriteLog("A snake deals " + damage + " HP of damage.");
            audio.playSound('Hurt');
        }
        else {
            WriteLog("The snake misses its attack.");
        }
    }

    tick() {
        if(this.isDying) {
            return;
        }
        let player = GetPlayer();
        if(player.isDead) {
            return;
        }
        let world = GetWorld();
        let map = world.getMap();
        ++this.moveLast;
        if(this.moveLast >= this.moveRate) {
            let path = map.findPath(this.location, player.getLocation());
            if(path.length < 1) {
                console.log("[snake] No path to player ...");
            }
            else if(path.length == 2) {
                if(!player.isInCombat()) {
                    console.log("[snake] Initiating combat ...");
                    player.addCombatTarget(this);
                    player.setInCombat(true, this);
                }
                else {
                    this.combatRound(player);
                }
            }
            else if(path.length > 9) {
                let roll = Math.random();
                if(roll < 0.25) {
                    if(map.canMove([this.location[0] + 1, this.location[1]])) {
                        this.location = [this.location[0] + 1, this.location[1]];
                    }
                }
                else if(roll < 0.5) {
                    if(map.canMove([this.location[0] - 1, this.location[1]])) {
                        this.location = [this.location[0] - 1, this.location[1]];
                    }
                }
                else if(roll < 0.75) {
                    if(map.canMove([this.location[0], this.location[1] + 1])) {
                        this.location = [this.location[0], this.location[1] + 1];
                    }
                }
                else {
                    if(map.canMove([this.location[0], this.location[1] - 1])) {
                        this.location = [this.location[0], this.location[1] - 1];
                    }
                }
            }
            else if(path.length == 1) {
                if(map.canMove([this.location[0] + 1, this.location[1]])) {
                    this.location = [this.location[0] + 1, this.location[1]];
                }
                else if(map.canMove([this.location[0] - 1, this.location[1]])) {
                    this.location = [this.location[0] - 1, this.location[1]];
                }
                else if(map.canMove([this.location[0], this.location[1] + 1])) {
                    this.location = [this.location[0], this.location[1] + 1];
                }
                else if(map.canMove([this.location[0], this.location[1] - 1])) {
                    this.location = [this.location[0], this.location[1] - 1];
                }
            }
            else {
                // console.log("[EvilEye] Tracking player to: " + path[1][0] + ", " + path[1][1]);
                this.location = [path[1][0], path[1][1]];
            }
            this.sprite.position.set(this.location[0] + 0.1, -0.5, this.location[1] + 0.1);
            this.moveLast = 0;
        }
    }

    id() {
        return "snake";
    }

    name() {
        return "Snake";
    }

    init() {
        const map = new THREE.TextureLoader().load( 'sprite/DC_Snake.png' );
        this.material = new THREE.SpriteMaterial({ 
            map: map, 
            transparent: true 
        });
        this.sprite = new THREE.Sprite( this.material );
        this.sprite.scale.set(0.4, 0.4, 0.4);
        this.sprite.position.set(this.location[0] + 0.1, -0.5, this.location[1] + 0.1);
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


export {EnemyEvilEye, EnemySnake}
