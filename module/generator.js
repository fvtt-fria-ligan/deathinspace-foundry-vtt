import { DISActor } from "./actor/actor.js";
import { ACTORS_PACK, ITEMS_PACK, TABLES_PACK } from "./packs.js";
import {
  documentFromPack,
  drawDocument,
  drawDocuments,
  drawText,
  simpleData,
} from "./packutils.js";
import { rollTotal } from "./utils.js";

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
  const firstName = await drawText(TABLES_PACK, "First Names");
  const lastName = await drawText(TABLES_PACK, "Last Names");
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
  const origin = await drawDocument(TABLES_PACK, "Origins");
  const originBenefit = await pickOriginBenefit(origin);

  // 3. character details
  const background = await drawText(TABLES_PACK, "Backgrounds");
  const trait = await drawText(TABLES_PACK, "Traits");
  const drive = await drawText(TABLES_PACK, "Drives");
  const looks = await drawText(TABLES_PACK, "Looks");

  // 4. past allegiance
  const pastAllegiance = await drawText(TABLES_PACK, "Past Allegiances");

  // 5. hit points and defense rating
  const hitPoints = await rollTotal("1d8");

  // 6. starting gear and starting bonus
  const holos = await rollTotal("3d10");
  const startingKitItems = await drawDocuments(TABLES_PACK, "Starting Kits");
  const personalTrinket = await drawDocument(TABLES_PACK, "Personal Trinkets");

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
      bonusItem = await drawDocument(TABLES_PACK, "Cosmic Mutations");
      break;
    case 2:
      bonusHitPoints = 3;
      break;
    case 3:
      bonusItem = await documentFromPack(ITEMS_PACK, "EVA Suit - Heavy");
      break;
    case 4:
      bonusItem = await documentFromPack(ITEMS_PACK, "Pistol");
      break;
    case 5:
      bonusFollower = await documentFromPack(ACTORS_PACK, "AI guard animal");
      break;
    case 6:
      bonusFollower = await documentFromPack(ACTORS_PACK, "Old Crew Member");
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
  const name = await drawText(TABLES_PACK, "Hub Names");
  const background = await drawText(TABLES_PACK, "Spacecraft Backgrounds");
  const quirk = await drawText(TABLES_PACK, "Hub Quirks");
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
  const frame = await documentFromPack(ITEMS_PACK, "Starting spacecraft");
  const engine = await documentFromPack(ITEMS_PACK, "Chemical engine");
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
  const name = await drawText(TABLES_PACK, "Hub Names");
  const background = await drawText(TABLES_PACK, "Station Backgrounds");
  const quirk = await drawText(TABLES_PACK, "Hub Quirks");
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
  const frame = await documentFromPack(ITEMS_PACK, "Starting station");
  const engine = await documentFromPack(ITEMS_PACK, "Industrial generator");
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
  const firstName = await drawText(TABLES_PACK, "First Names");
  const lastName = await drawText(TABLES_PACK, "Last Names");
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
  const background = await drawText(TABLES_PACK, "Backgrounds");
  const firstImpressions = await drawText(TABLES_PACK, "First Impressions");
  const looks = await drawText(TABLES_PACK, "Looks");

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
