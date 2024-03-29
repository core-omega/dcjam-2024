import { GetCharacterManager } from "../character/manager.js";
import { LocalMap } from "../display/map.js";
import { GetPlayer } from "../character/player.js";
import { EnemyEvilEye, EnemySnake } from "../character/enemy.js";

class World {
    constructor() {
        this.map = new LocalMap();
        let start = window.performance.now();
        console.log(window.performance.now() - start);
        this.player = GetPlayer();
        this.player.setPosition(this.map.getStartLocation());
        console.log("[world] Player starting at " + this.map.getStartLocation());
        this.player.initControls();
        this.player.setWorld(this);
        let charManager = GetCharacterManager();
        charManager.add(GetPlayer());
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

function GetDistance(location1, location2) {
    return Math.sqrt(
        (location1[0] - location2[0]) * (location1[0] - location2[0]) +
        (location1[1] - location2[1]) * (location1[1] - location2[1])
    );
}

export {GetWorld, GetDistance}
