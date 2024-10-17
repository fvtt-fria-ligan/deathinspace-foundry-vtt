import AbilityCheckDialog from "../dialog/ability-check-dialog.js";
import AddItemDialog from "../dialog/add-item-dialog.js";
import AttackDialog from "../dialog/attack-dialog.js";
import { diceSound, showDice } from "../dice.js";
import { regenerateCharacter, regenerateNpc } from "../generator.js";
import { ITEMS_PACK, TABLES_PACK } from "../packs.js";
import { documentFromPack, simpleData } from "../packutils.js";

/**
 * @extends {Actor}
 */
export class DISActor extends Actor {
  // TODO: make DISActor subclasses work correctly
  // seems like Foundry can only handle setting a single Actor.documentClass ?

  /** @override */
  static async create(data, options = {}) {
    data.prototypeToken = data.prototypeToken || {};
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
    foundry.utils.mergeObject(data.prototypeToken, defaults, {
      overwrite: false,
    });
    return super.create(data, options);
  }
  //This and the function below it calculate slot max number automatically and puts it in as a variable under actor.system.maxSlots
  prepareDerivedData(){
	  const actorData = this;
	  const systemData = actorData.system;
	  
	  this._prepareData(actorData);
  }
  
  _prepareData(actorData){
	  const systemData = actorData.system;
	  systemData.maxSlots = systemData.abilities.body.value + 12;
	  //this next part makes the DR automatically
	  const itemArray = Array.from(actorData.items);
	  let totalDefense = 0;
	  
	  for(let i=0;i<itemArray.length;i++){
		  if(!itemArray[i].system.defenseRatingBonus){}
		  else{ totalDefense += itemArray[i].system.defenseRatingBonus;}
	  }
	  
	  systemData.defenseRating = systemData.abilities.dexterity.value + totalDefense + 12;
  }

  _onCreate(data, options, userId) {
    super._onCreate(data, options, userId);
    // give new Hubs the 4 core functions
    if (data.type === "hub" && game.packs) {
      this._addCoreFunctionItems();
    }
  }
  //determines if encumbered or not
  get isEncumbered(){
	  const itemArray = Array.from(this.items);
	  let slotsUsed = 0;
	  
	  for(let i=0;i<itemArray.length;i++){
		  if(!itemArray[i].system.slots){}
		  else if((itemArray[i].name == "EVA Suit - Light" || itemArray[i].name == "EVA Suit - Heavy") && itemArray[i].system.equipped){}
		  else {slotsUsed += itemArray[i].system.slots;}
	  }
	  
	if(slotsUsed>this.system.maxSlots){return true;}
	else{return false;}
  }
  
  get hasVoidPoints() {
    return this.system.voidPoints && this.system.voidPoints.value;
  }

  async _addCoreFunctionItems() {
    const coreFunctionNames = [
      "(CF) Command Center",
      "(CF) Crew Quarters",
      "(CF) Life Support",
      "(CF) Mess",
    ];
    for (const coreFunctionName of coreFunctionNames) {
      const doc = await documentFromPack(ITEMS_PACK, coreFunctionName);
      if (!doc) {
        console.error(`Could not find ${coreFunctionName} in ${ITEMS_PACK}`);
        continue;
      }
      await this.createEmbeddedDocuments("Item", [simpleData(doc)]);
    }
  }

  _onCreateDescendantDocuments(
    parent,
    collection,
    documents,
    data,
    options,
    userId
  ) {
    // TODO: move these checks into character.js and hub.js subclasses
    if (documents[0].type === CONFIG.DIS.itemTypes.origin) {
      this._deleteEarlierItems(CONFIG.DIS.itemTypes.origin);
    }
    if (documents[0].type === CONFIG.DIS.itemTypes.frame) {
      this._deleteEarlierItems(CONFIG.DIS.itemTypes.frame);
      this.update({
        ["system.condition.value"]: documents[0].system.condition,
        ["system.fuel.value"]: documents[0].system.fuelDepot,
      });
    }
    super._onCreateDescendantDocuments(
      parent,
      collection,
      documents,
      data,
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
  
  async rollRecovery(){
	  //get BDY
	  const body = this.system.abilities.body.value;
	  //roll 1d8+BDY
	  const roll = new Roll(`1d8 + ${body}`);
	  await roll.evaluate();
	  //if outcome was positive
	  if(roll.total > 0){
		  //do not exceed max health
		  const newValue = Math.min(this.system.hitPoints.value + roll.total, this.system.hitPoints.max);
		  //set value
		  await this.update({ ["system.hitPoints.value"]: newValue});
	  }
	  //chat message
	  roll.toMessage({
		  user: game.user.id,
		  sound: diceSound(),
		  speaker: ChatMessage.getSpeaker({actor: this}),
		  flavor: `Recovered ${roll.total} hit points`
	  });
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
    if (rollType === "disadvantage" || this.isEncumbered) {
      d20Formula = "2d20kl";
    } else if (rollType === "advantage" && !this.isEncumbered) {
      d20Formula = "2d20kh";
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
    await abilityRoll.evaluate();
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
    const attackAbility = item.system.ability;
    await this.rollAttack(
      item.name,
      attackAbility,
      item.system.damage,
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
    await attackRoll.evaluate();
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
      damageRoll = new Roll(damageFormula);
      await damageRoll.evaluate();
      // TODO: including crit die in max formula means crits are less likely to reduce target condition
      const maxDamageRoll = new Roll(damageFormula);
      await maxDamageRoll.evaluate({ maximize: true });
      const isMaxDamage = damageRoll.total == maxDamageRoll.total;
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
    console.log(item);
    const roll = new Roll(item.system.damage);
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
    await moraleRoll.evaluate();
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
    await reactionRoll.evaluate();
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
    if (this.type === "character") {
      regenerateCharacter(this);
    } else if (this.type === "npc") {
      regenerateNpc(this);
    }
  }

  async decrementVoidPoints() {
    if (!this.hasVoidPoints) {
      return;
    }
    await this.update({
      ["system.voidPoints.value"]: this.system.voidPoints.value - 1,
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
      const table = await documentFromPack(TABLES_PACK, "Void Corruption");
      await table.draw();
    }
  }
}
