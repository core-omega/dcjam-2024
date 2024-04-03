import { GetCharacterManager } from "../character/manager.js";
import { LocalMap } from "../display/map.js";
import { GetPlayer } from "../character/player.js";
import { EnemyEvilEye, EnemySnake } from "../character/enemy.js";
import { GetLootManager } from "../item/loot.js";
import { Ladder } from "../item/ladder.js";

class World {
    LOOT_COUNT = 10;

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

    initWorld() {
        let loot = GetLootManager();
        let player = GetPlayer();
        for(var i = 0; i < 10; ++i) {
            loot.randomize();
        }

        let location = this.map.getRandomLocation();
        loot.add(1, "treasure", location);
        // console.log(this.map.findPath([2, 2], location));

        this.ladder = new Ladder();
        this.ladder.create(this.map.getStartLocation());
    }

    getExit() {
        return this.map.getStartLocation();
    }

    render() {
        let charManager = GetCharacterManager();
        charManager.update();
        this.map.render();
        if(charManager.count() < 8) {
            let enemy = null;
            if(Math.random() < 0.6) {
                enemy = new EnemyEvilEye();
            }
            else {
                enemy = new EnemySnake();
            }
            enemy.location = this.map.getRandomLocation();
            console.log("[world] New enemy of type " + enemy.name() + " spawned at " + enemy.location);
            charManager.add(enemy);
        }
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
