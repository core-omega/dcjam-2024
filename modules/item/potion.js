class HealingPotion {
    use(player) {
        player.modifyHP(50);
    }

    id() {
        return "lesserhealing";
    }

    icon() {
        return "image/potion.png";
    }

    description() {
        return "Restores 50 HP.";
    }

    name() {
        return "Lesser Potion of Healing";
    }
}

class StaminaPotion {
    use(player) {
        player.modifyStamina(50);
    }

    id() {
        return "lesserstamina";
    }

    icon() {
        return "image/potion.png";
    }

    description() {
        return "Restores 50 points of stamina.";
    }

    name() {
        return "Lesser Potion of Stamina";
    }
}

export {HealingPotion, StaminaPotion}
