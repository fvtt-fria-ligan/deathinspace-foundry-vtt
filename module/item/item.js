import { diceSound, showDice } from "../dice.js";

/**
 * @extends {Item}
 */
export class DISItem extends Item {
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.system.brokenClass = this.broken ? "broken" : "";
  }

  get broken() {
    return (
      this.system.condition &&
      this.system.condition.max &&
      !this.system.condition.value
    );
  }

  get equipped() {
    return this.system.equipped === true;
  }

  get usesAmmo() {
    return this.system.ammo && this.system.ammo.max;
  }

  get outOfAmmo() {
    return this.usesAmmo && !this.system.ammo.value;
  }

  async equip() {
    await this.update({ "system.equipped": true });
  }

  async unequip() {
    await this.update({ "system.equipped": false });
  }

  async checkCondition() {
    if (!this.system.condition.value) {
      return;
    }
    const conditionRoll = new Roll("1d6");
    conditionRoll.evaluate({ async: false });
    await showDice(conditionRoll);

    let conditionOutcome;
    if (conditionRoll.total === 1) {
      await this.decrementCondition();
      if (this.broken) {
        conditionOutcome = game.i18n.localize("DIS.ItemBroken");
      } else {
        conditionOutcome = game.i18n.localize("DIS.ConditionReduced");
      }
    } else {
      conditionOutcome = game.i18n.localize("DIS.ConditionUnaffected");
    }

    const chatData = {
      cardTitle: `Check condition for ${this.name}`,
      conditionOutcome,
      conditionRoll,
    };
    const html = await renderTemplate(
      "systems/deathinspace/templates/chat/test-condition.html",
      chatData
    );
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  async decrementCondition() {
    if (!this.system.condition.value) {
      return;
    }
    await this.update({
      ["system.condition.value"]: this.system.condition.value - 1,
    });
  }

  async decrementAmmo() {
    if (!this.usesAmmo || this.outOfAmmo) {
      return;
    }
    await this.update({ ["system.ammo.value"]: this.system.ammo.value - 1 });
  }
}
