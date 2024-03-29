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
                map[i][j] = 1;
            }
        }

        let visited = [];
        for(var i = 0; i < height; ++i) {
            visited[i] = [];
            for(var j = 0; j < width; ++j) {
                visited[i][j] = false;
            }
        }
        let carve = width * height * 0.75;
        for(var i = 0; i < carve; ++i) {
            let location = [
                Math.floor(1 + this.random.random() * (height - 2)), 
                Math.floor(1 + this.random.random() * (width - 2))
            ];
            if(visited[location[0]][location[1]]) {
                --i;
            } 
            else {
                visited[location[0]][location[1]] = true;
                map[location[0]][location[1]] = 0;
            }
        }

        // console.log(map);
        return map;
    }
}

export {Generator}