import * as THREE from 'three';
import { GetRenderManager } from './render.js';
import { Generator } from '../world/generator.js';

class LocalMap {
    constructor() {
        this.needsUpdate = true;

        const loader = new THREE.TextureLoader();

        // load a texture
        const wallTexture = loader.load(
            'texture/Steel.png'
        );

        const floorTexture = loader.load(
            'texture/Floor_01.png'
        );

        const ceilingTexture = loader.load(
            'texture/Ceiling_01.png'
        );

        this.floorGeometry = new THREE.BoxGeometry(1, 0.5, 1);
        this.floorMaterial = new THREE.MeshStandardMaterial({
            map: floorTexture,
            metalness: 1.0
        });

        this.ceilingGeometry = new THREE.BoxGeometry(1, 0.5, 1);
        this.ceilingMaterial = new THREE.MeshStandardMaterial({
            map: ceilingTexture,
            metalness: 0.0
        });

        this.geometry = new THREE.BoxGeometry( 1, 1, 1 );
        this.material = new THREE.MeshStandardMaterial({ 
            map: wallTexture,
            metalness: 0.4
        });
        this.root = new THREE.Object3D();
        this.generator = new Generator();
        this.map = this.generator.generate();
        this.wall = [

        ];
        this.floor = [

        ];
        this.ceiling = [

        ];
    }

    getStartLocation() {
        return this.generator.getStartLocation();
    }

    findPath(source, destination) {
        let queue = [[source[0], source[1]]];
        let path = [[[source[0], source[1]]]];
        let visited = [];
        // FIXME: visited dimensions are off from what they need to be - workaround is setting to larger than map.
        for(var i = 0; i < 125; ++i) {
            visited[i] = [];
            for(var j = 0; j < 125; ++j) {
                visited[i][j] = false;
            }
        }

        while(queue.length != 0) {
            let current = queue.shift();
            let cpath = path.shift();
            if(!visited[current[0]][current[1]]) {
                visited[current[0]][current[1]] = true;
                if(current[0] == destination[0] && current[1] == destination[1]) {
                    return cpath;
                }
                if(this.canMove([current[0] + 1, current[1]])) {
                    queue.push([current[0] + 1, current[1]]);
                    let tpath = [];
                    for(var i = 0; i < cpath.length; ++i) {
                        tpath[i] = [cpath[i][0], cpath[i][1]];
                    }
                    tpath.push([current[0] + 1, current[1]]);
                    path.push(tpath);
                }
                if(this.canMove([current[0] - 1, current[1]])) {
                    queue.push([current[0] - 1, current[1]]);
                    let tpath = [];
                    for(var i = 0; i < cpath.length; ++i) {
                        tpath[i] = [cpath[i][0], cpath[i][1]];
                    }
                    tpath.push([current[0] - 1, current[1]]);
                    path.push(tpath);

                }
                if(this.canMove([current[0], current[1] + 1])) {
                    queue.push([current[0], current[1] + 1]);
                    let tpath = [];
                    for(var i = 0; i < cpath.length; ++i) {
                        tpath[i] = [cpath[i][0], cpath[i][1]];
                    }
                    tpath.push([current[0], current[1] + 1]);
                    path.push(tpath);

                }
                if(this.canMove([current[0], current[1] - 1])) {
                    queue.push([current[0], current[1] - 1]);
                    let tpath = [];
                    for(var i = 0; i < cpath.length; ++i) {
                        tpath[i] = [cpath[i][0], cpath[i][1]];
                    }
                    tpath.push([current[0], current[1] - 1]);
                    path.push(tpath);
                }
            }
        }

        return [];
    }

    canMove(location) {
        if(location[1] >= this.map.length || location[1] < 0) {
            // console.log("[local-map] Location out of bounds: " + location[0] + ", " + location[1]);
            return false;
        }
        if(location[0] >= this.map[0].length || location[0] < 0) {
            // console.log("[local-map] Location out of bounds: " + location[0] + ", " + location[1]);
            return false;
        }
        if(this.map[location[1]][location[0]] % 2 == 0) {
            // console.log("" + location[1] + "," + location[0] + " => " + this.map[location[1]][location[0]]);
            return true;
        }
        // console.log("" + location[1] + "," + location[0] + " => " + this.map[location[1]][location[0]]);
        return false;
    }

    clear() {
        while(this.root.children.length > 0){ 
            this.root.remove(this.root.children[0]); 
        }
        this.needsUpdate = true;
    }

    update() {
        this.clear();
        for(var i = 0; i < this.map.length; ++i) {
            this.wall[i] = [];
            this.floor[i] = [];
            this.ceiling[i] = [];
            for(var j = 0; j < this.map[i].length; ++j) {
                if(this.map[i][j] != 0) {
                    this.wall[i][j] = new THREE.Mesh(this.geometry, this.material);
                    this.wall[i][j].position.z = i;
                    this.wall[i][j].position.x = j;
                    this.root.add(this.wall[i][j]);
                }

                this.floor[i][j] = new THREE.Mesh(this.floorGeometry, this.floorMaterial);
                this.floor[i][j].position.z = i;
                this.floor[i][j].position.x = j;
                this.floor[i][j].position.y = -1;
                this.root.add(this.floor[i][j]);

                this.ceiling[i][j] = new THREE.Mesh(this.ceilingGeometry, this.ceilingMaterial);
                this.ceiling[i][j].position.z = i;
                this.ceiling[i][j].position.x = j;
                this.ceiling[i][j].position.y = 1;
                this.root.add(this.ceiling[i][j]);
                
            }
        }
        GetRenderManager().getScene().add(this.root);
        this.needsUpdate = false;
    }

    render() {
        if(this.needsUpdate) {
            this.update();
        }

    }

    requestUpdate() {
        this.needsUpdate = true;
    }

    
}

export {LocalMap}
