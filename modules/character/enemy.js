import * as THREE from 'three';
import { GetRenderManager } from "../display/render.js";
import { GetAudioManager } from '/modules/world/audio.js';
import { GetPlayer } from './player.js';
import { GetWorld } from '../world/world.js';
import { WriteLog } from '../display/show.js';
import { RollD } from '../utility/random.js';
import { GetLootManager } from '../item/loot.js';

class Enemy {
    constructor() {
        this.renderInit = true;
        this.root = new THREE.Object3D();
        this.moveLast = 0;
        this.location = [3, 12];
        this.isDying = false;
        this.isDead = false;
        this.verticalModifier = 0.0;
    }

    executeDrop() {
        let aggregate = 0.0;

        for(var i = 0; i < this.drops.length; ++i) {
            aggregate += this.drops[i].chance;            
            if(Math.random() < aggregate) {
                return this.drops[i];
            }
        }
        return null;
    }

    executeDeath() {
        this.isDead = true;
        while(this.root.children.length > 0){ 
            this.root.remove(this.root.children[0]); 
        }
        this.material.dispose();
        GetRenderManager().getScene().remove(this.root);
        let loot = GetLootManager();
        let drop = this.executeDrop();
        if(drop != null) {
            loot.add(drop.quantity, drop.type, [this.location[0], this.location[1]]);
        }
    }

    modifyHP(value) {
        this.hp += value;
        if(this.hp <= 0) {
            this.hp = 0;
            this.isDying = true;
            WriteLog("The " + this.name() + " has begun to die.");
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
        WriteLog("An " + this.name() + " rolls 1d20 :: " + roll + "!");
        let dexDiff = player.dexterity - this.dexterity;
        dexDiff = (dexDiff <= 10) ? dexDiff : 10;
        if(roll > dexDiff) {
            let damage = RollD(1, this.strength);
            player.modifyHP(-1 * damage);
            WriteLog("The " + this.name() + " deals " + damage + " HP of damage.");
            audio.playSound('Hurt');
        }
        else {
            WriteLog("The " + this.name() + " misses its attack.");
        }
    }
    
    init() {
        const map = new THREE.TextureLoader().load( this.texture );
        this.material = new THREE.SpriteMaterial({ 
            map: map, 
            transparent: true 
        });
        this.sprite = new THREE.Sprite( this.material );
        this.sprite.position.set(this.location[0] + 0.1, 0 - this.verticalModifier, this.location[1] + 0.1);
        let render = GetRenderManager();
        this.root.add(this.sprite);
        render.getScene().add(this.root);
        this.renderInit = false;
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
                console.log("[" + this.name() + "] No path to player ...");
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
                    console.log("[" + this.name() + "] Initiating combat ...");
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
            this.sprite.position.set(this.location[0] + 0.1, 0 - this.verticalModifier, this.location[1] + 0.1);
            this.moveLast = 0;
        }
    }
}

class EnemyEvilEye extends Enemy {
    constructor() {
        super();
        this.moveRate = 4;       // move once per X ticks
        this.dexterity = 5;
        this.strength = 8;
        this.hp = 40;
        this.hpMax = 40;

        this.drops = [{
            chance: 0.2,
            type: "lesserhealing",
            quantity: 1
        },
        {
            chance: 0.2,
            type: "lesserstamina",
            quantity: 1
        }];

        this.texture = "sprite/DC_Eye.png";
    }

    id() {
        return "evileye";
    }

    name() {
        return "Evil Eye";
    }

    render() {
        if(this.renderInit) {
            this.init();
        }
    }
}

class EnemySnake extends Enemy {
    constructor() {
        super();
        this.moveRate = 3;       // move once per X ticks
        this.dexterity = 15;
        this.strength = 15;
        this.isDying = false;
        this.isDead = false;
        this.hp = 60;
        this.hpMax = 60;

        this.drops = [{
            chance: 0.25,
            type: "lesserhealing",
            quantity: 1
        },
        {
            chance: 0.25,
            type: "lesserstamina",
            quantity: 1
        }];

        this.texture = "sprite/DC_Snake.png";
        this.verticalModifier = 0.4;
    }

    id() {
        return "snake";
    }

    name() {
        return "Snake";
    }

    render() {
        if(this.renderInit) {
            this.init();
        }
    }
}


export {EnemyEvilEye, EnemySnake}
