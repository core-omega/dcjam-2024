import { Random } from "../utility/random.js";
import { Dungeon } from "2d-dungeon";

class Generator {
    constructor() {
        this.random = new Random("Frank's Dungeon");  // why not?
    }

    generate(width, height) {
        let random = this.random;
        width = (width) ? width : 64;
        height = (height) ? height : 64;
        let map = [];

        let dungeon = new Dungeon({
            max_iterations: 50,
            size: [125, 125],
            seed: "abcd", //omit for generated seed
            rooms: {
                initial: {
                    min_size: [3, 3],
                    max_size: [3, 3],
                    max_exits: 3,
                    position: [0, 0], //OPTIONAL pos of initial room
                },
                any: {
                    min_size: [4, 4],
                    max_size: [8, 8],
                    max_exits: 4,
                },
            },
            max_corridor_length: 15,
            min_corridor_length: 10,
            corridor_density: 2.5, //corridors per room
            symmetric_rooms: false, // exits must be in the center of a wall if true
            interconnects: 1, //extra corridors to connect rooms and make circular paths. not 100% guaranteed
            max_interconnect_length: 10,
            room_count: 40,
        });
    
        dungeon.generate();
        for(var i = 0; i < dungeon.maxx; ++i) {
            map[i] = [];
            for(var j = 0; j < dungeon.maxy; ++j) {
                map[i][j] = (dungeon.walls.get([i, j])) ? 1 : 0;
            }
        }
        console.log(dungeon);

        console.log(map);
        return map;
    }
}

export {Generator}