class InputManager {
    constructor() {
        this.keys = new Set();
        this.scroll = 1.0;
        this.callbacks = {};
    }

    start() {
        document.addEventListener("keydown", event => {
            //console.log("[input] keydown: " + event.code);
            this.keys.add(event.code);
        });
        document.addEventListener("keyup", event => {
            //console.log("[input] keyup: " + event.code);
            this.keys.delete(event.code);
        });
    }

    getScroll() {
        return this.scroll;
    }

    isKeyDown(code) {
        return this.keys.has(code);
    }
};

let input = new InputManager();

function GetInputManager() {
    return input;
}

export {GetInputManager};
