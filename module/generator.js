import { DISActor } from "./actor/actor.js";
import { ACTORS_PACK, ITEMS_PACK, TABLES_PACK } from "./packs.js";
import {
  documentFromPack,
  drawDocumentFromTableUuid,
  drawDocumentsFromTableUuid,
  drawTextFromTableUuid,
  simpleData
} from "./packutils.js";
import { rollTotal } from "./utils.js";

const playerTables = {
  backgrounds: "Compendium.deathinspace.death-in-space-tables.RollTable.VQt6wl9vTRCMR6sp",
  cosmicMutations: "Compendium.deathinspace.death-in-space-tables.RollTable.QetsxgpbcwDyG6Qv",
  drives: "Compendium.deathinspace.death-in-space-tables.RollTable.ZBUQ67XZeGHypwZo",
  firstImpressions: "Compendium.deathinspace.death-in-space-tables.RollTable.JWTU6mENX6cdUEni",
  firstNames: "Compendium.deathinspace.death-in-space-tables.RollTable.T84lZU5390mYMvwZ",
  lastNames: "Compendium.deathinspace.death-in-space-tables.RollTable.P3lER80MbPdRDPDC",
  looks: "Compendium.deathinspace.death-in-space-tables.RollTable.C8QtASDc7ktWbk4k",
  origins: "Compendium.deathinspace.death-in-space-tables.RollTable.nxkWKuqDww6isGRM",
  pastAllegiances: "Compendium.deathinspace.death-in-space-tables.RollTable.DHAo1FNU1cRJytA3",
  personalTrinkets: "Compendium.deathinspace.death-in-space-tables.RollTable.6qG7ovmnlgTlxSL5",
  startingKits: "Compendium.deathinspace.death-in-space-tables.RollTable.8MUhuEy08AtEb57q",
  traits: "Compendium.deathinspace.death-in-space-tables.RollTable.m4TJkhkwoStofy9t",
  voidCorruptions: "Compendium.deathinspace.death-in-space-tables.RollTable.I4S63MuPQLeXxYS8",
};

const playerItems = {
  evaSuitHeavy: "Compendium.deathinspace.death-in-space-items.Item.9XJfAnUe6U02vLbk",
  pistol: "Compendium.deathinspace.death-in-space-items.Item.m4ljG8bXPL3bNy2B",
};

const playerCompanions = {
  aiGuardAnimal: "Compendium.deathinspace.death-in-space-actors.Actor.Q4JmzUXY2YX9tajm",
  oldCrewMember: "Compendium.deathinspace.death-in-space-actors.Actor.TLBpnoBfOt3ilQwZ",
};

const hubTables = {
  hubNames: "Compendium.deathinspace.death-in-space-tables.RollTable.A72aYCwjYyvanBQ1",
  hubQuirks: "Compendium.deathinspace.death-in-space-tables.RollTable.netMPWbwtcRaeZQv",
  spacecraftBackgrounds: "Compendium.deathinspace.death-in-space-tables.RollTable.0OFqCQWrstfppyKk",
  stationBackgrounds: "Compendium.deathinspace.death-in-space-tables.RollTable.U9XisR4xvhUKe67X",
};

const hubItems = {
  chemicalEngine: "Compendium.deathinspace.death-in-space-items.Item.kfF1FW0INeCFAsT3",
  industrialGenerator: "Compendium.deathinspace.death-in-space-items.Item.dHN6uJgAx1N7efX5",
  startingSpacecraftFrame: "Compendium.deathinspace.death-in-space-items.Item.xjP9HUPlkfAsfkrw",
  startingStationFrame: "Compendium.deathinspace.death-in-space-items.Item.UUV3NTRwyFmiaKQF",
};

export async function generateCharacter() {
  const char = await randomCharacter();
  const actor = await DISActor.create(char);
  await maybeGiveStartingBonus(actor);
  actor.sheet.render(true);
}

export async function regenerateCharacter(actor) {
  const actorData = await randomCharacter();
  await actor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
  await actor.update(actorData);
  await maybeGiveStartingBonus(actor);
  // update any actor tokens in the scene, too
  for (const token of actor.getActiveTokens()) {
    await token.document.update({
      name: actor.name,
      texture: {
        src: actor.prototypeToken.texture.src,
      },
    });
  }
}

async function randomCharacter() {
  const firstName = await drawTextFromTableUuid(playerTables.firstNames);
  const lastName = await drawTextFromTableUuid(playerTables.lastNames);
  const name = `${firstName} ${lastName}`;
  const imageBase = randomCharacterImageBase();
  const portrait = `systems/deathinspace/assets/images/portraits/characters/${imageBase}.jpg`;
  const token = `systems/deathinspace/assets/images/tokens/characters/${imageBase}.png`;

  // 1. abilities
  const body = await generateAbilityValue();
  const dexterity = await generateAbilityValue();
  const savvy = await generateAbilityValue();
  const tech = await generateAbilityValue();

  const defenseRating = 12 + dexterity;

  // 2. origin
  const origin = await drawDocumentFromTableUuid(playerTables.origins);
  const originBenefit = await pickOriginBenefit(origin);

  // 3. character details
  const background = await drawTextFromTableUuid(playerTables.backgrounds);
  const trait = await drawTextFromTableUuid(playerTables.traits);
  const drive = await drawTextFromTableUuid(playerTables.drives);
  const looks = await drawTextFromTableUuid(playerTables.looks);

  // 4. past allegiance
  const pastAllegiance = await drawTextFromTableUuid(playerTables.pastAllegiances);

  // 5. hit points and defense rating
  const hitPoints = await rollTotal("1d8");

  // 6. starting gear and starting bonus
  const holos = await rollTotal("3d10");
  const startingKitItems = await drawDocumentsFromTableUuid(playerTables.startingKits);
  const personalTrinket = await drawDocumentFromTableUuid(playerTables.personalTrinkets);

  const items = [origin, originBenefit, personalTrinket].concat(
    startingKitItems
  );
  const itemData = items.map((d) => simpleData(d));

  const actorData = {
    name,
    system: {
      abilities: {
        body: { value: body },
        dexterity: { value: dexterity },
        savvy: { value: savvy },
        tech: { value: tech },
      },
      background,
      defenseRating,
      drive,
      hitPoints: {
        max: hitPoints,
        value: hitPoints,
      },
      holos,
      looks,
      pastAllegiance,
      trait,
    },
    img: portrait,
    items: itemData,
    prototypeToken: {
      name: name,
      texture: {
        src: token,
      },
    },
    type: "character",
  };

  return actorData;
}

async function maybeGiveStartingBonus(actor) {
  const sumOfAbilityScores =
    actor.system.abilities.body.value +
    actor.system.abilities.dexterity.value +
    actor.system.abilities.savvy.value +
    actor.system.abilities.tech.value;
  if (sumOfAbilityScores >= 0) {
    // no starting bonus
    return;
  }
  const bonusRoll = await rollTotal("1d6");
  let bonusItem = null;
  let bonusHitPoints = 0;
  let bonusFollower = null;
  switch (bonusRoll) {
    case 1:
      bonusItem = await drawDocumentFromTableUuid(playerTables.cosmicMutations);
      break;
    case 2:
      bonusHitPoints = 3;
      break;
    case 3:
      bonusItem = await fromUuid(playerItems.evaSuitHeavy);
      break;
    case 4:
      bonusItem = await fromUuid(playerItems.pistol);
      break;
    case 5:
      bonusFollower = await fromUuid(playerCompanions.aiGuardAnimal);
      break;
    case 6:
      bonusFollower = await fromUuid(playerCompanions.oldCrewMember);
      break;
  }

  if (bonusItem) {
    await actor.createEmbeddedDocuments("Item", [simpleData(bonusItem)]);
  }
  if (bonusHitPoints) {
    const newHP = actor.system.hitPoints.max + bonusHitPoints;
    await actor.update({
      ["system.hitPoints.max"]: newHP,
      ["system.hitPoints.value"]: newHP,
    });
  }
  if (bonusFollower) {
    // TODO: randomize follower stats
    const followerData = simpleData(bonusFollower);
    const firstName = actor.name.split(" ")[0];
    followerData.name = `${firstName}'s ${followerData.name}`;
    if (game.user.can("ACTOR_CREATE")) {
      const follower = await DISActor.create(followerData);
      follower.sheet.render(true);
    } else {
      ui.notifications.info(
        `Ask the GM to create an NPC for you: ${followerData.name}`,
        { permanent: true }
      );
    }
  }
}

async function generateAbilityValue() {
  const firstD4 = await rollTotal("1d4");
  const secondD4 = await rollTotal("1d4");
  return firstD4 - secondD4;
}

async function pickOriginBenefit(origin) {
  if (origin.system.benefitNames) {
    const names = origin.system.benefitNames.split(",");
    if (names.length) {
      const randName = names[Math.floor(Math.random() * names.length)];
      const pack = game.packs.get(ITEMS_PACK);
      const docs = await pack.getDocuments();
      const benefit = docs.find((i) => i.name === randName);
      return benefit;
    }
  }
}

function randomCharacterImageBase() {
  // prefix for our portrait jpgs and token pngs
  const maxNum = 102;
  const randNum = Math.floor(Math.random() * maxNum) + 1;
  const padded = randNum.toString().padStart(2, "0");
  return `character_${padded}`;
}

export async function generateSpacecraft() {
  const defenseRating = 11;
  const maxCondition = 5;
  const fuelCapacity = 6;
  const name = await drawTextFromTableUuid(hubTables.hubNames);
  const background = await drawTextFromTableUuid(hubTables.spacecraftBackgrounds);
  const quirk = await drawTextFromTableUuid(hubTables.hubQuirks);
  const actorData = {
    name,
    system: {
      background,
      condition: {
        max: maxCondition,
        value: maxCondition,
      },
      fuel: {
        max: fuelCapacity,
        value: fuelCapacity,
      },
      defenseRating,
      quirks: quirk,
    },
    img: "systems/deathinspace/assets/images/icons/frames/frame-spacecraft.png",
    type: "hub",
  };
  const actor = await DISActor.create(actorData);
  const frame = await fromUuid(hubItems.startingSpacecraftFrame);
  const engine = await fromUuid(hubItems.chemicalEngine);
  await actor.createEmbeddedDocuments("Item", [
    simpleData(frame),
    simpleData(engine),
  ]);
  actor.sheet.render(true);
}

export async function generateStation() {
  const defenseRating = 11;
  const maxCondition = 5;
  const fuelCapacity = 4;
  const name = await drawTextFromTableUuid(hubTables.hubNames);
  const background = await drawTextFromTableUuid(hubTables.stationBackgrounds);
  const quirk = await drawTextFromTableUuid(hubTables.hubQuirks);
  const actorData = {
    name,
    system: {
      background,
      condition: {
        max: maxCondition,
        value: maxCondition,
      },
      fuel: {
        max: fuelCapacity,
        value: fuelCapacity,
      },
      defenseRating,
      quirks: quirk,
    },
    img: "systems/deathinspace/assets/images/icons/frames/frame-station.png",
    type: "hub",
  };
  const actor = await DISActor.create(actorData);
  const frame = await fromUuid(hubItems.startingStationFrame);
  const engine = await fromUuid(hubItems.industrialGenerator);
  await actor.createEmbeddedDocuments("Item", [
    simpleData(frame),
    simpleData(engine),
  ]);
  actor.sheet.render(true);
}

export async function generateNpc() {
  const npc = await randomNpc();
  const actor = await DISActor.create(npc);
  actor.sheet.render(true);
}

export async function regenerateNpc(actor) {
  const actorData = await randomNpc();
  await actor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
  await actor.update(actorData);
  // update any actor tokens in the scene, too
  for (const token of actor.getActiveTokens()) {
    await token.document.update({
      name: actor.name,
      texture: {
        src: actor.prototypeToken.texture.src,
      },
    });
  }
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 *
 * https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
 */
function randomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function randomNpc() {
  const firstName = await drawTextFromTableUuid(playerTables.firstNames);
  const lastName = await drawTextFromTableUuid(playerTables.lastNames);
  const name = `${firstName} ${lastName}`;
  const imageBase = randomCharacterImageBase();
  const portrait = `systems/deathinspace/assets/images/portraits/characters/${imageBase}.jpg`;
  const token = `systems/deathinspace/assets/images/tokens/characters/${imageBase}.png`;

  // 1. abilities
  const body = await generateAbilityValue();
  const dexterity = await generateAbilityValue();
  const savvy = await generateAbilityValue();
  const tech = await generateAbilityValue();
  const morale = randomInt(4, 11);

  // 2. character details
  const background = await drawTextFromTableUuid(playerTables.backgrounds);
  const firstImpressions = await drawTextFromTableUuid(playerTables.firstImpressions);
  const looks = await drawTextFromTableUuid(playerTables.looks);

  // 3. hit points and defense rating
  const hitPoints = await rollTotal("1d8");
  const defenseRating = 12 + dexterity;

  // 6. starting gear
  const holos = await rollTotal("3d10");

  const actorData = {
    name,
    system: {
      abilities: {
        body: { value: body },
        dexterity: { value: dexterity },
        savvy: { value: savvy },
        tech: { value: tech },
      },
      background,
      defenseRating,
      firstImpressions,
      hitPoints: {
        max: hitPoints,
        value: hitPoints,
      },
      holos,
      looks,
      morale,
    },
    img: portrait,
    items: [],
    prototypeToken: {
      name: name,
      texture: {
        src: token,
      },
    },
    type: "npc",
  };

  return actorData;
}
