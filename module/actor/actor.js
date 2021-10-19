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

    async abilityCheck(ability) {
        console.log(this.getRollData());
        const roll = new Roll(`1d20 + @abilities.${ability}.value`, this.getRollData());
        roll.toMessage({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ actor: this }),
            flavor: `${ability.toUpperCase()} check`
        });
    }
}