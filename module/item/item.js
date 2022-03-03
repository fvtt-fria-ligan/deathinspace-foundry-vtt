import { diceSound, showDice } from "../dice.js";

/**
 * @extends {Item}
 */
export class DISItem extends Item {

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.data.data.brokenClass = this.broken ? "broken" : "";
  }

  get broken() {
    return this.data.data.condition && this.data.data.condition.max && !this.data.data.condition.value;
  }

  get equipped() {
    return this.data.data.equipped === true;
  }  

  get usesAmmo() {
    return this.data.data.ammo && this.data.data.ammo.max;
  }

  get outOfAmmo() {
    return this.usesAmmo && !this.data.data.ammo.value;
  }

  async equip() {
    await this.update({ "data.equipped": true });
  }

  async unequip() {
    await this.update({ "data.equipped": false });
  }

  async checkCondition() {
    if (!this.data.data.condition.value) {
      return;
    }
    const conditionRoll = new Roll("1d6");
    conditionRoll.evaluate({ async: false });
    await showDice(conditionRoll);    

    let conditionOutcome;
    if (conditionRoll.total === 1) {
      conditionOutcome = "Condition reduced by one."
      if (this.data.data.condition.current === 1) {
        conditionOutcome += " Item is broken.";         
      }
      await this.decrementCondition();
    } else {
      conditionOutcome = "Condition unaffected."
    }

    const chatData = {
      cardTitle: `Check condition for ${this.name}`,
      conditionOutcome,
      conditionRoll
    }
    const html = await renderTemplate(
      "systems/deathinspace/templates/chat/test-condition.html", chatData);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  async decrementCondition() {
    if (!this.data.data.condition.value) {
      return;
    }
    await this.update({ ["data.condition.value"]:  this.data.data.condition.value - 1 });
  }

  async decrementAmmo() {
    if (!this.usesAmmo || this.outOfAmmo) {
      return;
    }
    await this.update({ ["data.ammo.value"]:  this.data.data.ammo.value - 1 });
  }
}
