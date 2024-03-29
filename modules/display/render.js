import * as THREE from 'three';
import { GetWorld } from '../world/world.js';

class RenderManager {
    constructor(element) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        document.getElementById(element).appendChild( this.renderer.domElement );

        this.counter = 0;
        this.startup = window.performance.now();

        this.registered = {};

        this.light = new THREE.PointLight(0xffffff, 1);
        this.light.position.set(0, 3, 0);
        this.scene.add(this.light);
    }

    getScene() {
        return this.scene;
    }

    getCamera() {
        return this.camera;
    }

    setLight(x, y, z) {
        this.light.position.set(x, y, z);
    }

    performance() {
        return this.counter / ((window.performance.now() - this.startup) / 1000.0);
    }

    register(key, self) {
        this.registered[key] = self['render'].bind(self);
    }

    clear(key) {
        delete this.registered[key];
    }

    onWindowResize() {
        console.log("[render] Window resized - updating aspect ratio and renderer size.")
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    start() {
        let self = this;
        function animate() {
            for (const [key, callback] of Object.entries(self.registered)) {
                callback(self.scene);
            }
            self.renderer.render(self.scene, self.camera);
            self.counter ++;
            requestAnimationFrame( animate );
        }
        animate();
        setInterval(function() {
            document.getElementById('performance').innerHTML = (Math.floor(self.performance() * 100) / 100.0) + " FPS";
            self.counter = 0;
            self.startup = window.performance.now();
        }, 5000);

        window.addEventListener( 'resize', this.onWindowResize.bind(this) );
    }
}

let render = undefined;

function CreateRenderManager(element) {
    render = new RenderManager(element);
}

function GetRenderManager() {
    return render;
}

export {CreateRenderManager, GetRenderManager}
