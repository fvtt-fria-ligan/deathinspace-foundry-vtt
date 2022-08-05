import AbilityCheckDialog from "../dialog/ability-check-dialog.js";
import AddItemDialog from "../dialog/add-item-dialog.js";
import AttackDialog from "../dialog/attack-dialog.js";
import { diceSound, showDice } from "../dice.js";
import { regenerateCharacter, regenerateNpc } from "../generator.js";
import { tableFromPack } from "../packutils.js";

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
        disposition: 1, // friendly
        vision: true,
      };
    } else if (data.type === "npc") {
      defaults = {
        actorLink: false,
        disposition: -1, // hostile
        vision: false,
      };
    } else if (data.type === "hub") {
      defaults = {
        actorLink: true,
        disposition: 0, // neutral
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

  get hasVoidPoints() {
    return this.system.voidPoints && this.system.voidPoints.value;
  }

  async _addCoreFunctionItems() {
    const pack = game.packs.get("deathinspace.hub-modules-core-functions");
    if (!pack) {
      console.error(
        "Could not find compendium deathinspace.hub-modules-core-functions"
      );
      return;
    }
    const index = await pack.getIndex();
    const coreFunctionNames = [
      "(CF) Command Center",
      "(CF) Crew Quarters",
      "(CF) Life Support",
      "(CF) Mess",
    ];
    for (const coreFunctionName of coreFunctionNames) {
      const entry = index.find((e) => e.name === coreFunctionName);
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
        ["system.condition.value"]: documents[0].system.condition,
        ["system.fuel.value"]: documents[0].system.fuelDepot,
      });
    }
    super._onCreateEmbeddedDocuments(
      embeddedName,
      documents,
      result,
      options,
      userId
    );
  }

  async _deleteItems(itemType) {
    const itemsOfType = this.items.filter((i) => i.type === itemType);
    const deletions = itemsOfType.map((i) => i.id);
    // not awaiting this async call, just fire it off
    this.deleteEmbeddedDocuments("Item", deletions);
  }

  async _deleteEarlierItems(itemType) {
    const itemsOfType = this.items.filter((i) => i.type === itemType);
    itemsOfType.pop(); // don't delete the last one
    const deletions = itemsOfType.map((i) => i.id);
    // not awaiting this async call, just fire it off
    this.deleteEmbeddedDocuments("Item", deletions);
  }

  async bodyCheck() {
    return this.showAbilityCheckDialog("body");
  }

  async dexterityCheck() {
    return this.showAbilityCheckDialog("dexterity");
  }

  async savvyCheck() {
    return this.showAbilityCheckDialog("savvy");
  }

  async techCheck() {
    return this.showAbilityCheckDialog("tech");
  }

  async showAddItemDialog() {
    const dialog = new AddItemDialog();
    dialog.actor = this;
    dialog.render(true);
  }

  async showAbilityCheckDialog(ability) {
    const checkDialog = new AbilityCheckDialog();
    checkDialog.actor = this;
    checkDialog.ability = ability;
    checkDialog.render(true);
  }

  formulaForRollType(rollType) {
    let d20Formula = "1d20";
    if (rollType === "advantage") {
      d20Formula = "2d20kh";
    } else if (rollType === "disadvantage") {
      d20Formula = "2d20kl";
    }
    return d20Formula;
  }

  async rollAbilityCheck(ability, rollType, opposed, useVoidPoint) {
    if (useVoidPoint) {
      await this.decrementVoidPoints();
    }

    const d20Formula = this.formulaForRollType(rollType);
    const abilityRoll = new Roll(
      `${d20Formula} + @abilities.${ability}.value`,
      this.getRollData()
    );
    abilityRoll.evaluate({ async: false });
    await showDice(abilityRoll);

    const targetDR = 12;
    const cardTitle = `${game.i18n.localize("DIS.Check")} ${ability}`;
    const drWord = opposed
      ? game.i18n.localize("DIS.Opponent")
      : `${game.i18n.localize("DIS.DR")}${targetDR}`;
    const abilityText = `${d20Formula}+${ability.toUpperCase()} ${game.i18n.localize(
      "DIS.Vs"
    )} ${drWord}`;

    let gainVoidPoint;
    let rollVoidCorruption;
    let abilityOutcome;
    if (opposed) {
      abilityOutcome = game.i18n.localize("DIS.HighestResultWins");
    } else {
      const success = abilityRoll.total >= targetDR;
      if (success) {
        abilityOutcome = game.i18n.localize("DIS.Success");
      } else if (useVoidPoint) {
        // failure when using a void point => void corruption
        abilityOutcome = game.i18n.localize("DIS.FailureRollVoidCorruption");
        rollVoidCorruption = true;
      } else {
        // regular failure, gain a void point
        abilityOutcome = game.i18n.localize("DIS.FailureGainVoidPoint");
        gainVoidPoint = true;
      }
    }
    const chatData = {
      abilityOutcome,
      abilityText,
      abilityRoll,
      cardTitle,
    };
    const html = await renderTemplate(
      "systems/deathinspace/templates/chat/ability-check.html",
      chatData
    );
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });

    if (gainVoidPoint) {
      await this.incrementVoidPoints();
    } else if (rollVoidCorruption) {
      this.rollVoidCorruption();
    }
  }

  async showAttackDialogWithItem(itemId) {
    const item = this.items.get(itemId);
    if (!item) {
      return;
    }
    if (item.broken) {
      ui.notifications.warn(
        `${game.i18n.localize("DIS.WeaponBroken").toUpperCase()}!!!`
      );
      return;
    }
    if (item.outOfAmmo) {
      ui.notifications.warn(
        `${game.i18n.localize("DIS.OutOfAmmo").toUpperCase()}!!!`
      );
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

  async rollAttackWithItem(itemId, defenderDR, rollType, risky, useVoidPoint) {
    const item = this.items.get(itemId);
    if (!item) {
      return;
    }
    await item.decrementAmmo();
    const attackAbility = item.data.data.ability;
    await this.rollAttack(
      item.name,
      attackAbility,
      item.data.data.damage,
      defenderDR,
      rollType,
      risky,
      useVoidPoint
    );
  }

  async rollAttack(
    attackName,
    attackAbility,
    attackDamage,
    defenderDR,
    rollType,
    risky,
    useVoidPoint
  ) {
    if (useVoidPoint) {
      await this.decrementVoidPoints();
    }

    const d20Formula = this.formulaForRollType(rollType);
    const attackTitle = `${game.i18n.localize("DIS.AttackWith")} ${attackName}`;
    const attackText = `${game.i18n.localize(
      "DIS.ToHit"
    )}: ${d20Formula}+${attackAbility.toUpperCase()} ${game.i18n.localize(
      "DIS.Vs"
    )} ${game.i18n.localize("DIS.DR")}${defenderDR}`;
    const rollData = this.getRollData();
    const attackRoll = new Roll(
      `${d20Formula} + @abilities.${attackAbility}.value`,
      rollData
    );
    attackRoll.evaluate({ async: false });
    await showDice(attackRoll);

    // use the active die result, in case of advantage/disadvantage
    const d20Result = attackRoll.terms[0].results.filter((r) => r.active)[0]
      .result;
    const isCrit = d20Result === 20;
    let attackOutcome;
    let rollVoidCorruption;
    let gainVoidPoint;
    let riskyOutcome;
    let damageRoll;
    let damageText;
    let maxDamageOutcome;
    if (isCrit || attackRoll.total >= defenderDR) {
      // hit
      attackOutcome = game.i18n.localize(
        isCrit ? "DIS.AttackCriticalHit" : "DIS.AttackHit"
      );
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
      // TODO: including crit die in max formula means crits are less likely to reduce target condition
      const maxDamageRoll = new Roll(damageFormula, {});
      maxDamageRoll.evaluate({ async: false, maximize: true });
      const isMaxDamage = damageRoll.total == maxDamageRoll.total;
      console.log(damageRoll);
      if (isMaxDamage) {
        maxDamageOutcome = game.i18n.localize("DIS.MaxDamageOutcome");
      }
      await showDice(damageRoll);
    } else if (useVoidPoint) {
      // miss when using void point
      attackOutcome = game.i18n.localize("DIS.AttackMissRollVoidCorruption");
      rollVoidCorruption = true;
      if (risky) {
        riskyOutcome = game.i18n.localize("DIS.RiskyAttackFailure");
      }
    } else {
      // miss
      attackOutcome = game.i18n.localize("DIS.AttackMissGainVoidPoint");
      gainVoidPoint = true;
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
      maxDamageOutcome,
      riskyOutcome,
      voidPointsClass: this.hasVoidPoints ? "enabled" : "disabled",
      voidPointsDisabled: this.hasVoidPoints ? "" : "disabled",
    };
    const html = await renderTemplate(
      "systems/deathinspace/templates/chat/attack-outcome.html",
      chatData
    );
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });

    if (gainVoidPoint) {
      await this.incrementVoidPoints();
    } else if (rollVoidCorruption) {
      this.rollVoidCorruption();
    }
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
      flavor: `${item.name} damage`,
    });
  }

  async rollNpcMorale() {
    const cardTitle = `${game.i18n.localize("Morale")} ${game.i18n.localize(
      "DIS.Check"
    )}`;
    const moraleText = `2D6 ${game.i18n.localize("Vs")} ${game.i18n.localize(
      "Morale"
    )}`;
    const moraleRoll = new Roll("2d6");
    moraleRoll.evaluate({ async: false });
    await showDice(moraleRoll);
    let moraleOutcome;
    if (moraleRoll.total > this.system.morale) {
      moraleOutcome = game.i18n.localize("DIS.MoraleFailure");
    } else {
      moraleOutcome = game.i18n.localize("DIS.MoraleSuccess");
    }

    const chatData = {
      cardTitle,
      moraleOutcome,
      moraleText,
      moraleRoll,
    };
    const html = await renderTemplate(
      "systems/deathinspace/templates/chat/morale.html",
      chatData
    );
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  async rollNpcReaction() {
    const cardTitle = `${game.i18n.localize("Reaction")}`;
    const reactionText = "2D6";
    const reactionRoll = new Roll("2d6");
    reactionRoll.evaluate({ async: false });
    await showDice(reactionRoll);
    let reactionOutcome;
    if (reactionRoll.total === 2) {
      reactionOutcome = game.i18n.localize("DIS.ReactionHostile");
    } else if (reactionRoll.total <= 5) {
      reactionOutcome = game.i18n.localize("DIS.ReactionUnfriendly");
    } else if (reactionRoll.total <= 8) {
      reactionOutcome = game.i18n.localize("DIS.ReactionUncertain");
    } else if (reactionRoll.total <= 11) {
      reactionOutcome = game.i18n.localize("DIS.ReactionTalkative");
    } else {
      reactionOutcome = game.i18n.localize("DIS.ReactionHelpful");
    }

    const chatData = {
      cardTitle,
      reactionOutcome,
      reactionText,
      reactionRoll,
    };
    const html = await renderTemplate(
      "systems/deathinspace/templates/chat/reaction.html",
      chatData
    );
    ChatMessage.create({
      content: html,
      sound: diceSound(),
      speaker: ChatMessage.getSpeaker({ actor: this }),
    });
  }

  async regenerate() {
    if (this.data.type === "character") {
      regenerateCharacter(this);
    } else if (this.data.type === "npc") {
      regenerateNpc(this);
    }
  }

  async decrementVoidPoints() {
    if (!this.hasVoidPoints) {
      return;
    }
    await this.update({
      ["data.voidPoints.value"]: this.system.voidPoints.value - 1,
    });
  }

  async incrementVoidPoints() {
    if (!this.system.voidPoints) {
      return;
    }
    // max 4 void points
    const newValue = Math.min(this.system.voidPoints.value + 1, 4);
    await this.update({ ["system.voidPoints.value"]: newValue });
  }

  async rollVoidCorruption() {
    const roll = new Roll("1d6");
    await roll.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${game.i18n.localize("DIS.VoidCorruption")}?`,
    });
    if (roll.total <= this.system.voidPoints.value) {
      const table = await tableFromPack(
        "deathinspace.character-creation",
        "Void Corruption"
      );
      await table.draw();
    }
  }
}
