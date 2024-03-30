import { GetRenderManager } from "../display/render.js";
import { GetAudioManager } from '/modules/world/audio.js';
import { Direction } from "../world/direction.js";
import { WriteLog, ShowInventory, HideInventory, ShowCharacter, HideCharacter, ForceShowOverlay } from "../display/show.js";
import { Random, RollD } from "../utility/random.js";
import { HealingPotion, ItemMapping, StaminaPotion } from "../item/potion.js";
import { GetLootManager } from "../item/loot.js";
import { StartingNote } from "../item/note.js";
import { GetCharacterManager } from "./manager.js";
import { GetDistance, GetWorld } from "../world/world.js";

class InventoryContainer {
    constructor(item) {
        this.quantity = 1;
        this.item = item;
    }
}

class Player {
    constructor() {
        // [x, y] in map grid - 0-indexed
        this.location = [3, 1];
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

        this.isDead = false;
        this.isDying = false;
        
        this.combatTarget = [

        ];
        
        this.staminaCost = {
            "move" : 3,
            "attack" : 7
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
        this.inventory[new StartingNote().id()] = new InventoryContainer(new StartingNote());
        this.inventory[new StartingNote().id()].quantity = 1;
        this.random = new Random("Player Random");
    }

    addCombatTarget(target) {
        if(!this.combat) {
            this.setInCombat(true, target);
        }
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
        if(this.isDead) {
            return;
        }
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
            this.isDead = true;
            this.immobile = true;
            ForceShowOverlay("<span style='color:red'>YOU DIED</span>");
            let audio = GetAudioManager();
            audio.playSound('Death');
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
        let charManager = GetCharacterManager();
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
        else if(charManager.find(this.location) != null) {
            let target = charManager.find(this.location);
            if(target.isDead || target.isDying) {
                WriteLog("This target is already dying.");
            }
            this.addCombatTarget(target);
        }
        else {
            WriteLog("Cannot attack anything nearby!");
        }
    }

    interact() {
        console.log("[player] Interaction.");
        let loot = GetLootManager();
        let found = loot.find(this.location);
        if(null != found) {
            console.log("[player] Found type: " + found.type);
            let item = new ItemMapping[found.type]();
            if(item.id() in this.inventory) {
                this.inventory[item.id()].quantity += found.quantity;
            } 
            else {
                this.inventory[item.id()] = new InventoryContainer(item);
                this.inventory[item.id()].quantity = found.quantity;
            }
            WriteLog("Found " + found.quantity + "x " + item.name());
            loot.take(found);
        }
        else {
            WriteLog("There's nothing here to interact with.");
        }
    }

    leave() {
        let world = GetWorld();
        let exit = world.getExit();
        if(GetDistance(exit, this.location) < 2.0) {
            let keys = Object.keys(this.inventory);
            let hasTreasure = false;
            for(var i = 0; i < keys.length; ++i) {
                if(keys[i] == "treasure") {
                    hasTreasure = true;
                }
            }
            if(hasTreasure) {
                console.log("[player] Exiting dungeon!");
                this.isDead = true;
                ForceShowOverlay("You have successfully escaped with the treasure and been paid 1 silver coin!  Great job!");
            }
            else {
                WriteLog("You can't leave without the treasure!  Read the note in your inventory.");
            }
        }

    }

    initControls() {
        document.getElementById('look-left').onclick = this.lookLeft.bind(this);
        document.getElementById('look-right').onclick = this.lookRight.bind(this);
        document.getElementById('go-forward').onclick = this.goForward.bind(this);
        document.getElementById('go-back').onclick = this.goBack.bind(this);
        document.getElementById('go-left').onclick = this.goLeft.bind(this);
        document.getElementById('go-right').onclick = this.goRight.bind(this);
        document.getElementById('go-up').onclick = this.leave.bind(this);
        document.getElementById('go-down').onclick = this.leave.bind(this);
        document.getElementById('inventory-button').onclick = this.showInventory.bind(this);
        document.getElementById('inventory-close').onclick = this.hideInventory.bind(this);
        document.getElementById('character-button').onclick = this.showCharacter.bind(this);
        document.getElementById('character-close').onclick = this.hideCharacter.bind(this);
        document.getElementById('attack-button').onclick = this.attack.bind(this);
        document.getElementById('interact-button').onclick = this.interact.bind(this);
    }

    setWorld(world) {
        this.world = world;
    }

    setPosition(location) {
        this.location[0] = location[0];
        this.location[1] = location[1];
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
        let status = "Normal";
        if(this.getHP() < 0.5 * this.getMaxHP()) {
            document.getElementById('hp-display').innerHTML = "<span style='color:yellow'>" + this.getHP() + "</span>";
            status = "Injured";
        }
        else {
            document.getElementById('hp-display').innerHTML = this.getHP();
        }
        document.getElementById('hp-display-max').innerHTML = this.getMaxHP();
        if(this.getStamina() < 0.5 * this.getMaxStamina()) {
            document.getElementById('stamina-display').innerHTML = "<span style='color:yellow'>" + this.getStamina() + "</span>";
            status = "Tired";
        }
        else {
            document.getElementById('stamina-display').innerHTML = this.getStamina();
        }
        document.getElementById('stamina-display-max').innerHTML = this.getMaxStamina();
        document.getElementById('status-display').innerHTML = status;
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
                    if(!this.inventory[key].item.infinite()) {
                        this.inventory[key].quantity --;
                    }
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
        document.getElementById('character-body').innerHTML = `
            <div>
            Strength: ` + this.strength + `<br />
            Dexterity: ` + this.dexterity + `<br /><br />
            </div>
        `;

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
