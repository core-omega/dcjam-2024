import { Random } from "../utility/random.js";

class Generator {
    constructor() {
        this.random = new Random("Frank's Dungeon");  // why not?
    }

    generate(width, height) {
        let random = this.random;
        width = (width) ? width : 64;
        height = (height) ? height : 64;
        let map = [];
        for(var i = 0; i < height; ++i) {
            map[i] = [];
            for(var j = 0; j < width; ++j) {
                if(i == 0 || j == 0) {
                    map[i][j] = 1;
                }
                else if(i == height - 1 || j == width - 1) {
                    map[i][j] = 1;
                }
                else {
                    map[i][j] = 0;
                }
            }
        }

        // console.log(map);
        return map;
    }
}

export {Generator}