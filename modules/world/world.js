import { GetCharacterManager } from "../character/manager.js";
import { LocalMap } from "../display/map.js";
import { GetPlayer } from "../character/player.js";
import { EnemyEvilEye } from "../character/enemy.js";

class World {
    constructor() {
        this.map = new LocalMap();
        let start = window.performance.now();
        this.map.findPath([1, 1], [63, 63]);
        console.log(window.performance.now() - start);
        this.player = GetPlayer();
        this.player.initControls();
        this.player.setWorld(this);
        let charManager = GetCharacterManager();
        charManager.add(GetPlayer());
        charManager.add(new EnemyEvilEye());
    }

    canMove(location) {
        return this.map.canMove(location);
    }

    render() {
        let charManager = GetCharacterManager();
        charManager.update();
        this.map.render();
    }

    getMap() {
        return this.map;
    }
}

let world = new World();

function GetWorld() {
    return world;
}

export {GetWorld}
