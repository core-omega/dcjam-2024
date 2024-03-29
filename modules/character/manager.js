class CharacterManager {
    constructor() {
        this.characters = [];
        this.tick = window.performance.now();
        this.tickInterval = 500;
    }

    add(ch) {
        this.characters.push(ch);
    }

    remove(ch) {
        for(var i = 0; i < this.characters.length; ++i) {
            if(this.characters[i].id() == ch) {
                this.characters.splice(i, 1);
                return;
            }
        }
    }

    update() {
        let now = window.performance.now();
        if(now - this.tick > this.tickInterval) {
            for(var i = 0; i < this.characters.length; ++i) {
                this.characters[i].tick();
            }
            this.tick = now;
        }
        for(var i = 0; i < this.characters.length; ++i) {
            this.characters[i].render();
        }
        for(var i = this.characters.length - 1; i >= 0; --i) {
            if(this.characters[i].isDead) {
                console.log("[character-manager] Removing dead character from list.");
                this.characters.splice(i, 1);
            }
        }
    }

    count() {
        return this.characters.length - 1;
    }
}

let charManager = new CharacterManager();

function GetCharacterManager() {
    return charManager;
}

export {GetCharacterManager}
