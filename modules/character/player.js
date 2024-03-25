import { GetRenderManager } from "../display/render.js";
import { GetAudioManager } from '/modules/world/audio.js';
import { Direction } from "../world/direction.js";
import { WriteLog, ShowInventory, HideInventory, ShowCharacter, HideCharacter } from "../display/show.js";
import { Random, RollD } from "../utility/random.js";
import { HealingPotion, StaminaPotion } from "../item/potion.js";

class InventoryContainer {
    constructor(item) {
        this.quantity = 1;
        this.item = item;
    }
}

class Player {
    constructor() {
        // [x, y] in map grid - 0-indexed
        this.location = [3, 0];
        this.orientation = Direction.SOUTH;

        this.uuid = "player";
        this.name = "Lone Survivor";
        this.dexterity = 10;
        this.strength = 8;

        this.hp = 250;
        this.hpMax = 250;
        this.stamina = 200;
        this.staminaMax = 200;
        this.dead = false;
        this.immobile = false;
        this.combat = false;
        this.combatTarget = [

        ];
        
        this.staminaCost = {
            "move" : 5,
            "attack" : 15
        };
        this.regen = {
            "stamina" : 2.5,
            "hp" : 0.1
        };
        this.inventory = {
            
        };
        this.inventory[new StaminaPotion().id()] = new InventoryContainer(new StaminaPotion());
        this.inventory[new StaminaPotion().id()].quantity = 5;
        this.inventory[new HealingPotion().id()] = new InventoryContainer(new HealingPotion());
        this.inventory[new HealingPotion().id()].quantity = 5;
        this.random = new Random("Player Random");
    }

    addCombatTarget(target) {
        for(var i = 0; i < this.combatTarget.length; ++i) {
            if(target == this.combatTarget[i]) {
                return;
            }
        }
        console.log("[player] Adding new combat target: " + target);
        this.combatTarget.push(target);
    }

    isInCombat() {
        return this.combat;
    }

    setInCombat(value, source) {
        if(value == this.combat) {
            return;
        }
        this.combat = value;
        let audio = GetAudioManager();
        if(this.combat) {
            WriteLog("You have entered combat with: " + source.name());
            audio.loopTrack('Battle');
        }
        else {
            WriteLog("You have completed the encounter.");
            audio.loopTrack('Intro');
        }
    }

    getLocation() {
        return this.location;
    }

    combatRound(source) {

    }

    modifyHP(value) {
        this.hp += value;
        if(this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
            this.immobile = true;
        }
        if(this.hp >= this.hpMax) {
            this.hp = this.hpMax;
        }
    }

    modifyStamina(value) {
        this.stamina += value;
        if(this.stamina <= 0) {
            this.stamina = 0;
        }
        if(this.stamina >= this.staminaMax) {
            this.stamina = this.staminaMax;
        }
    }

    getHP() {
        return Math.floor(this.hp);
    }

    getMaxHP() {
        return Math.floor(this.hpMax);
    }

    getStamina() {
        return Math.floor(this.stamina);
    }

    getMaxStamina() {
        return Math.floor(this.staminaMax);
    }

    attack() {
        if(this.isInCombat()) {
            if(this.getStamina() < this.staminaCost["attack"]) {
                WriteLog("You are too exhausted to attack!");
                return;
            }
            this.modifyStamina(-1 * this.staminaCost["attack"]);

            let audio = GetAudioManager();
            let roll = RollD(1, 20);
            WriteLog("You roll a 1d20 :: " + roll + "!");
            let dexDiff = this.combatTarget[0].dexterity - this.dexterity;
            dexDiff = (dexDiff <= 10) ? dexDiff : 10;
            if(roll > dexDiff) {
                let damage = RollD(1, this.strength);
                this.combatTarget[0].modifyHP(-1 * damage);
                WriteLog("You deal " + damage + " HP of damage.");
                audio.playSound('Hit');
            }

            for(var i = this.combatTarget.length - 1; i >= 0; --i) {
                if(this.combatTarget[i].isDying) {
                    console.log("[player] Removing dead enemy from combat.");
                    this.combatTarget.splice(i, 1);
                }
            }
            
            if(this.combatTarget.length == 0) {
                this.setInCombat(false, null);
                console.log("[player] Ending combat.");
            }
        }
        else {
            WriteLog("Cannot attack when not in combat!");
        }
    }

    initControls() {
        document.getElementById('look-left').onclick = this.lookLeft.bind(this);
        document.getElementById('look-right').onclick = this.lookRight.bind(this);
        document.getElementById('go-forward').onclick = this.goForward.bind(this);
        document.getElementById('go-back').onclick = this.goBack.bind(this);
        document.getElementById('go-left').onclick = this.goLeft.bind(this);
        document.getElementById('go-right').onclick = this.goRight.bind(this);
        document.getElementById('inventory-button').onclick = this.showInventory.bind(this);
        document.getElementById('inventory-close').onclick = this.hideInventory.bind(this);
        document.getElementById('character-button').onclick = this.showCharacter.bind(this);
        document.getElementById('character-close').onclick = this.hideCharacter.bind(this);
        document.getElementById('attack-button').onclick = this.attack.bind(this);
    }

    setWorld(world) {
        this.world = world;
    }

    updateCamera() {
        GetRenderManager().getCamera().position.set(this.location[0], 0, this.location[1]);
        GetRenderManager().setLight(this.location[0], 0, this.location[1]);
        if(this.orientation == Direction.NORTH) {
            GetRenderManager().getCamera().lookAt(this.location[0], 0, this.location[1] - 3);
            document.getElementById('compass').innerHTML = 'W | | | | | | | <span style="color:red">N</span> | | | | | | | E';
        }
        if(this.orientation == Direction.SOUTH) {
            GetRenderManager().getCamera().lookAt(this.location[0], 0, this.location[1] + 3);
            document.getElementById('compass').innerHTML = 'E | | | | | | | S | | | | | | | W';
        }
        if(this.orientation == Direction.WEST) {
            GetRenderManager().getCamera().lookAt(this.location[0] - 3, 0, this.location[1]);
            document.getElementById('compass').innerHTML = 'S | | | | | | | W | | | | | | | <span style="color:red">N</span>';
        }
        if(this.orientation == Direction.EAST) {
            GetRenderManager().getCamera().lookAt(this.location[0] + 3, 0, this.location[1]);
            document.getElementById('compass').innerHTML = '<span style="color:red">N</span> | | | | | | | E | | | | | | | S';
        }
    }

    updateStats() {
        document.getElementById('hp-display').innerHTML = this.getHP();
        document.getElementById('hp-display-max').innerHTML = this.getMaxHP();
        document.getElementById('stamina-display').innerHTML = this.getStamina();
        document.getElementById('stamina-display-max').innerHTML = this.getMaxStamina();
    }

    render() {
        this.updateCamera();
        this.updateStats();
    }

    id() {
        return this.uuid;
    }

    tick() {
        this.stamina += this.regen["stamina"];
        if(this.stamina >= this.staminaMax) {
            this.stamina = this.staminaMax;
        }
        this.hp += this.regen["hp"];
        if(this.hp >= this.hpMax) {
            this.hp = this.hpMax;
        }
        if(this.combatTarget.length == 0) {
            this.setInCombat(false, null);
        }
    }

    showInventory() {
        document.getElementById('inventory-body').innerHTML = "";
        for (const [key, value] of Object.entries(this.inventory)) {
            document.getElementById('inventory-body').innerHTML += `
            <div class="inventory-entry" id='` + this.inventory[key].item.id() + `'>
                <div class="inventory-qty">` + this.inventory[key].quantity + `</div>
                <div class="inventory-name">` + this.inventory[key].item.name() + `</div>
            </div>`;
        }
        for (const [key, value] of Object.entries(this.inventory)) {
            document.getElementById(this.inventory[key].item.id()).onclick = () => {
                if(this.inventory[key].quantity > 0) {
                    let audio = GetAudioManager();
                    audio.playSound('UseItem');
                    this.inventory[key].item.use(this);
                    this.inventory[key].quantity --;
                    this.hideInventory();
                }
            }
        }

        ShowInventory();
    }

    hideInventory() {
        HideInventory();
    }

    showCharacter() {
        ShowCharacter();
    }

    hideCharacter() {
        HideCharacter();
    }

    ////////////////////////////////// Player controls 
    lookRight() {
        if(this.immobile) {
            WriteLog("You have been immobilized and cannot perform any actions.");
            return;
        }
        if(this.orientation == Direction.NORTH) {
            this.orientation = Direction.EAST;
        }
        else if(this.orientation == Direction.EAST) {
            this.orientation = Direction.SOUTH;
        }
        else if(this.orientation == Direction.SOUTH) {
            this.orientation = Direction.WEST;
        }
        else if(this.orientation == Direction.WEST) {
            this.orientation = Direction.NORTH;
        }
    }

    lookLeft() {
        if(this.immobile) {
            WriteLog("You have been immobilized and cannot perform any actions.");
            return;
        }
        if(this.orientation == Direction.NORTH) {
            this.orientation = Direction.WEST;
        }
        else if(this.orientation == Direction.EAST) {
            this.orientation = Direction.NORTH;
        }
        else if(this.orientation == Direction.SOUTH) {
            this.orientation = Direction.EAST;
        }
        else if(this.orientation == Direction.WEST) {
            this.orientation = Direction.SOUTH;
        }
    }

    goForward() {
        if(this.combat) {
            WriteLog("You cannot move while you are in combat.");
            return;
        }
        if(this.immobile) {
            WriteLog("You have been immobilized and cannot perform any actions.");
            return;
        }
       if(this.stamina < this.staminaCost["move"]) {
            WriteLog("You are too exhausted to move.");
            return;
        }
        if(this.orientation == Direction.NORTH) {
            if(this.world.canMove([this.location[0], this.location[1] - 1])) {
                this.location[1] --;
                let audio = GetAudioManager();
                audio.playSound('Walk');
                this.stamina -= this.staminaCost["move"];
            } 
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
        if(this.orientation == Direction.SOUTH) {
            if(this.world.canMove([this.location[0], this.location[1] + 1])) {
                this.location[1] ++;
                let audio = GetAudioManager();
                audio.playSound('Walk');
                this.stamina -= this.staminaCost["move"];
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
        if(this.orientation == Direction.EAST) {
            if(this.world.canMove([this.location[0] + 1, this.location[1]])) {
                this.location[0] ++;
                let audio = GetAudioManager();
                audio.playSound('Walk');
                this.stamina -= this.staminaCost["move"];
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
        if(this.orientation == Direction.WEST) {
            if(this.world.canMove([this.location[0] - 1, this.location[1]])) {
                this.location[0] --;
                let audio = GetAudioManager();
                audio.playSound('Walk');
                this.stamina -= this.staminaCost["move"];
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
    }

    goLeft() {
        if(this.combat) {
            WriteLog("You cannot move while you are in combat.");
            return;
        }
        if(this.immobile) {
            WriteLog("You have been immobilized and cannot perform any actions.");
            return;
        }
        if(this.stamina < this.staminaCost["move"]) {
            WriteLog("You are too exhausted to move.");
            return;
        }
        if(this.orientation == Direction.NORTH) {
            if(this.world.canMove([this.location[0] - 1, this.location[1]])) {
                this.location[0] --;
                let audio = GetAudioManager();
                audio.playSound('Walk');
                this.stamina -= this.staminaCost["move"];
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
        if(this.orientation == Direction.SOUTH) {
            if(this.world.canMove([this.location[0] + 1, this.location[1]])) {
                this.location[0] ++;
                let audio = GetAudioManager();
                audio.playSound('Walk');
                this.stamina -= this.staminaCost["move"];
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
        if(this.orientation == Direction.EAST) {
            if(this.world.canMove([this.location[0], this.location[1] - 1])) {
                this.location[1] --;
                let audio = GetAudioManager();
                audio.playSound('Walk');
                this.stamina -= this.staminaCost["move"];
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
        if(this.orientation == Direction.WEST) {
            if(this.world.canMove([this.location[0], this.location[1] + 1])) {
                this.location[1] ++;
                let audio = GetAudioManager();
                audio.playSound('Walk');
                this.stamina -= this.staminaCost["move"];
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
    }

    goBack() {
        if(this.combat) {
            WriteLog("You cannot move while you are in combat.");
            return;
        }
        if(this.immobile) {
            WriteLog("You have been immobilized and cannot perform any actions.");
            return;
        }
        if(this.stamina < this.staminaCost["move"]) {
            WriteLog("You are too exhausted to move.");
            return;
        }
        if(this.orientation == Direction.NORTH) {
            if(this.world.canMove([this.location[0], this.location[1] + 1])) {
                this.location[1] ++;
                let audio = GetAudioManager();
                audio.playSound('Walk');
                this.stamina -= this.staminaCost["move"];
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
        if(this.orientation == Direction.SOUTH) {
            if(this.world.canMove([this.location[0], this.location[1] - 1])) {
                this.location[1] --;
                let audio = GetAudioManager();
                audio.playSound('Walk');
                this.stamina -= this.staminaCost["move"];
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
        if(this.orientation == Direction.EAST) {
            if(this.world.canMove([this.location[0] - 1, this.location[1]])) {
                this.location[0] --;
                let audio = GetAudioManager();
                audio.playSound('Walk');
                this.stamina -= this.staminaCost["move"];
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
        if(this.orientation == Direction.WEST) {
            if(this.world.canMove([this.location[0] + 1, this.location[1]])) {
                this.location[0] ++;
                let audio = GetAudioManager();
                audio.playSound('Walk');
                this.stamina -= this.staminaCost["move"];
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
    }

    goRight() {
        if(this.combat) {
            WriteLog("You cannot move while you are in combat.");
            return;
        }
        if(this.immobile) {
            WriteLog("You have been immobilized and cannot perform any actions.");
            return;
        }
        if(this.stamina < this.staminaCost["move"]) {
            WriteLog("You are too exhausted to move.");
            return;
        }
        if(this.orientation == Direction.NORTH) {
            if(this.world.canMove([this.location[0] + 1, this.location[1]])) {
                this.location[0] ++;
                this.stamina -= this.staminaCost["move"];
                let audio = GetAudioManager();
                audio.playSound('Walk');
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
        if(this.orientation == Direction.SOUTH) {
            if(this.world.canMove([this.location[0] - 1, this.location[1]])) {
                this.location[0] --;
                this.stamina -= this.staminaCost["move"];
                let audio = GetAudioManager();
                audio.playSound('Walk');
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
        if(this.orientation == Direction.EAST) {
            if(this.world.canMove([this.location[0], this.location[1] + 1])) {
                this.location[1] ++;
                this.stamina -= this.staminaCost["move"];
                let audio = GetAudioManager();
                audio.playSound('Walk');
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
        if(this.orientation == Direction.WEST) {
            if(this.world.canMove([this.location[0], this.location[1] - 1])) {
                this.location[1] --;
                this.stamina -= this.staminaCost["move"];
                let audio = GetAudioManager();
                audio.playSound('Walk');
            }
            else {
                let audio = GetAudioManager();
                audio.playSound('Bounce');
            }
        }
    }

}

let player = new Player();

function GetPlayer() {
    return player;
}

export {GetPlayer};
