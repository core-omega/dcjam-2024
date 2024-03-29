import { ForceHideOverlay, ForceShowOverlay } from "../display/show.js";

class StartingNote {
    use(player) {
        ForceShowOverlay(`The note reads:<br /><div class='note-text'><div class='note-internal'>
        <br />
        Hello adventurer,<br /><br />
        As previously agreed, the contract states that you are to find the treasure within the ancient ruins.  
        Once you have found the treasure, you are to make your escape.  As always, please do remember that the
        Adventurer's Guild disclaims any and all liability related to lacerations, poisoning, dismemberment,
        and all other forms of physical and / or mental injury.<br /><br />
        We wish you the best on your trip.<br /><br />
        Sincerely,<br />
        The Adventurer's Guild<br /><br />
        </div></div>
        <div class='inventory-close' id='note-close'>Close</div>`);
        document.getElementById('note-close').onclick = () => {
            ForceHideOverlay();
        }
    }

    infinite() {
        return true;
    }

    id() {
        return "startingnote";
    }

    icon() {
        return "image/note.png";
    }

    description() {
        return "You should probably read this.";
    }

    name() {
        return "A Mysterious Note";
    }
}

export {StartingNote};
