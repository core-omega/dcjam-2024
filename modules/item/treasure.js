import { WriteLog } from "../display/show.js";

class Treasure {
    use(player) {
        WriteLog("It's very shiny.");
    }

    id() {
        return "treasure";
    }

    icon() {
        return "image/treasure.png";
    }

    description() {
        return "It's treasure!";
    }

    name() {
        return "Treasure";
    }

    infinite() {
        return true;
    }
}

export {Treasure}
