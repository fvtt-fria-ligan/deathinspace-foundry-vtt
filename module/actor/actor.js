import { diceSound, showDice } from "../dice.js";
import { regenerateCharacter } from "../generator.js";
import AttackDialog from "./sheet/attack-dialog.js";

/**
 * @extends {Actor}
 */
export class DISActor extends Actor {
  // TODO: make DISActor subclasses work correctly
  // seems like Foundry can only handle setting a single Actor.documentClass ?

  /** @override */
  static async create(data, options = {}) {
    data.token = data.token || {};
    let defaults = {};
    if (data.type === "character") {
      defaults = {
        actorLink: true,
        disposition: 1,  // friendly
        vision: true,
      };
    } else if (data.type === "npc") {
      defaults = {
        actorLink: false,
        disposition: -1,  // hostile
        vision: false,
      };
    } else if (data.type === "hub") {
      defaults = {
        actorLink: true,
        disposition: 0,  // neutral
        vision: true,
      };
    }
    mergeObject(data.token, defaults, { overwrite: false });
    return super.create(data, options);
  }
  
  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    // give new Hubs the 4 core functions
    if (data.type === "hub" && game.packs) {
      this._addCoreFunctionItems();
    }
  }

  async _addCoreFunctionItems() {
    const pack = game.packs.get("deathinspace.hub-modules-core-functions");
    if (!pack) {
      console.error("Could not find compendium deathinspace.hub-modules-core-functions");
      return;
    }
    const index = await pack.getIndex();
    const coreFunctionNames = [
      "(CF) Command Center",
      "(CF) Crew Quarters",
      "(CF) Life Support",
      "(CF) Mess"
    ];  
    for (const coreFunctionName of coreFunctionNames) {
      const entry = index.find(e => e.name === coreFunctionName);
      if (!entry) {
        console.error(`Could not find entry ${coreFunctionName}`);
        continue;
      }
      const entity = await pack.getDocument(entry._id);
      if (!entity) {
        console.error(`Could not get document for ${coreFunctionName}`);
        continue;
      }
      await this.createEmbeddedDocuments("Item", [duplicate(entity.data)]);
    }
  }

  _onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId) {
    // TODO: move these checks into character.js and hub.js subclasses
    if (documents[0].data.type === CONFIG.DIS.itemTypes.origin) {
      this._deleteEarlierItems(CONFIG.DIS.itemTypes.origin);
    }
    if (documents[0].data.type === CONFIG.DIS.itemTypes.frame) {
      this._deleteEarlierItems(CONFIG.DIS.itemTypes.frame);
      this.update({
        ["data.condition.value"]: documents[0].data.data.condition,
        ["data.fuel.value"]: documents[0].data.data.fuelDepot,
      });
    }
    super._onCreateEmbeddedDocuments(embeddedName, documents, result, options, userId);
  }

  async _deleteItems(itemType) {
    const itemsOfType = this.items.filter(i => i.data.type === itemType);
    const deletions = itemsOfType.map(i => i.id);
    // not awaiting this async call, just fire it off
    this.deleteEmbeddedDocuments("Item", deletions);
  }

  async _deleteEarlierItems(itemType) {
    const itemsOfType = this.items.filter(i => i.data.type === itemType);
    itemsOfType.pop();  // don't delete the last one
    const deletions = itemsOfType.map(i => i.id);
    // not awaiting this async call, just fire it off
    this.deleteEmbeddedDocuments("Item", deletions);
  }

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
    const roll = new Roll(
      `1d20 + @abilities.${ability}.value`,
      this.getRollData()
    );
    roll.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${ability.toUpperCase()} check`,
    });
  }

  async showAttackDialogWithItem(itemId) {
    const item = this.items.get(itemId);
    if (!item) {
      return;
    }
    if (item.broken) {
      ui.notifications.warn(`${game.i18n.localize("DIS.WeaponBroken").toUpperCase()}!!!`);
      return;
    }
    if (item.outOfAmmo) {
      ui.notifications.warn(`${game.i18n.localize("DIS.OutOfAmmo").toUpperCase()}!!!`);
      return;
    }
    const attackDialog = new AttackDialog();
    attackDialog.actor = this;
    attackDialog.itemId = item.id;
    attackDialog.render(true);
  }

  async showAttackDialog(attackName, attackAbility, attackDamage) {
    const attackDialog = new AttackDialog();
    attackDialog.actor = this;
    attackDialog.attackName = attackName;
    attackDialog.attackAbility = attackAbility;
    attackDialog.attackDamage = attackDamage;
    attackDialog.render(true);
  }

  async rollAttackWithItem(itemId, defenderDR, rollType, risky) {
    const item = this.items.get(itemId);
    if (!item) {
      return;
    }
    await item.decrementAmmo();
    const attackAbility = item.data.data.weaponType === "melee" ? "body" : "tech";
    await this.rollAttack(item.name, attackAbility, item.data.data.damage, defenderDR, rollType, risky);
  }

  async rollAttack(attackName, attackAbility, attackDamage, defenderDR, rollType, risky) {
    let d20Formula = "1d20";
    if (rollType === "advantage") {
      d20Formula = "2d20kh";
    } else if (rollType === "disadvantage") {
      d20Formula = "2d20kl";
    }
    const attackTitle = `${game.i18n.localize("DIS.AttackWith")} ${attackName}`;
    const attackText = `${game.i18n.localize("DIS.ToHit")}: ${d20Formula}+${attackAbility.toUpperCase()} ${game.i18n.localize("DIS.Vs")} ${game.i18n.localize("DIS.DR")}${defenderDR}`; 
    const rollData = this.getRollData();
    const attackRoll = new Roll(
      `${d20Formula} + @abilities.${attackAbility}.value`,
      rollData
    );
    attackRoll.evaluate({ async: false });
    await showDice(attackRoll);

    const d20Result = attackRoll.terms[0].results[0].result;
    const isCrit = d20Result === 20;
    let attackOutcome;
    let riskyOutcome;
    let damageRoll;
    let damageText;
    if (isCrit || attackRoll.total >= defenderDR) {
      // hit
      attackOutcome = game.i18n.localize(isCrit ? "DIS.AttackCriticalHit" : "DIS.AttackHit");
      const baseDamage = attackDamage;
      let damageFormula = baseDamage;
      if (isCrit) {
        damageFormula += ` + ${baseDamage}`;
      }
      if (risky) {
        damageFormula += ` + ${baseDamage}`;
        riskyOutcome = game.i18n.localize("DIS.RiskyAttackSuccess");
      }
      damageText = `Damage: ${damageFormula}`;
      damageRoll = new Roll(damageFormula, {});
      damageRoll.evaluate({ async: false });
      await showDice(damageRoll);
    } else {
      // miss
      attackOutcome = game.i18n.localize("DIS.AttackMiss");
      if (risky) {
        riskyOutcome = game.i18n.localize("DIS.RiskyAttackFailure");
      }
    }

    const chatData = {
      attackName,
      attackOutcome,
      attackRoll,
      attackText,
      attackTitle,
      damageRoll,
      damageText,
      riskyOutcome,
    };
    const html = await renderTemplate(
      "systems/deathinspace/templates/chat/attack-outcome.html", chatData);
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });    
  }

  // async rollItemAttack(itemId) {
  //   const item = this.items.get(itemId);
  //   if (!item) {
  //     return;
  //   }
  //   const weaponType =
  //     item.data.data.weaponType[0].toUpperCase() +
  //     item.data.data.weaponType.substring(1);
  //   const roll = new Roll(
  //     `1d20 + @abilities.${ability}.value`,
  //     this.getRollData()
  //   );
  //   roll.toMessage({
  //     user: game.user.id,
  //     speaker: ChatMessage.getSpeaker({ actor: this }),
  //     flavor: `${weaponType} attack with ${item.name}`,
  //   });
  // }

  async rollItemDamage(itemId) {
    const item = this.items.get(itemId);
    if (!item) {
      return;
    }
    const roll = new Roll(item.data.data.damage);
    roll.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${item.name} damage`,
    });
  }

  async rollNpcAttack() {
    const roll = new Roll(`1d20 + @attackBonus`, this.getRollData());
    roll.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `Attack with ${this.data.data.attack}`,
    });
  }

  async rollNpcDamage() {
    if (!this.data.data.damage) {
      return;
    }
    const roll = new Roll(this.data.data.damage);
    roll.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${this.data.data.attack} damage`,
    });
  }

  async rollNpcMorale() {
    const roll = new Roll("2d6");
    roll.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `Morale`,
    });
  }

  async regenerate() {
    regenerateCharacter(this);
  }
}
