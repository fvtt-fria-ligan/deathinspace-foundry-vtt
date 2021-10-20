/**
 * @extends {Actor}
 */
export class DISActor extends Actor {

    async bodyCheck() {
        return this.abilityCheck("body");
    }

    async dexterityCheck() {
        return this.abilityCheck("dexterity");
    }

    async savvyCheck() {
        return this.abilityCheck("savvy");
    }

    async techCheck() {
        return this.abilityCheck("tech");
    }

    async rollAbilityCheck(ability) {
        const roll = new Roll(`1d20 + @abilities.${ability}.value`, this.getRollData());
        roll.toMessage({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: `${ability.toUpperCase()} check`
        });
    }

    async rollItemAttack(itemId) {
        const item = this.items.get(itemId);
        if (!item) {
            return;
        }
        let ability;
        if (item.weaponType === "melee") {
            ability = "body";
        } else {
            ability = "tech"
        }
        const weaponType = item.data.data.weaponType[0].toUpperCase() + item.data.data.weaponType.substring(1);
        const roll = new Roll(`1d20 + @abilities.${ability}.value`, this.getRollData());
        roll.toMessage({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: `${weaponType} attack with ${item.name}`
        });
    }

    async rollItemDamage(itemId) {
        const item = this.items.get(itemId);
        if (!item) {
            return;
        }
        const roll = new Roll(item.data.data.damage);
        roll.toMessage({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: `${item.name} damage`
        });
    }

    // TODO: move into Npc.js subclass

    async rollNpcAttack() {
        const roll = new Roll(`1d20 + @attackBonus`, this.getRollData());
        roll.toMessage({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: `Attack with ${this.data.data.attack}`
        });
    }

    async rollNpcDamage() {
        const roll = new Roll(this.data.data.damage);
        roll.toMessage({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: `${this.data.data.attack} damage`
        });        
    }    

    async rollNpcMorale() {
        const roll = new Roll("2d6");
        roll.toMessage({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: `Morale`
        });
    }
}