import { DISActor } from "./actor/actor.js";
import {
  documentFromPack,
  drawDocument,
  drawDocuments,
  drawText,
  simpleData,
} from "./packutils.js";

const CREATION_PACK = "deathinspace.death-in-space-tables";

export const generateCharacter = async () => {
  const char = await randomCharacter();
  const actor = await DISActor.create(char);
  await maybeGiveStartingBonus(actor);
  actor.sheet.render(true);
};

export const regenerateCharacter = async (actor) => {
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
};

const randomCharacter = async () => {
  const firstName = await drawText(CREATION_PACK, "First Names");
  const lastName = await drawText(CREATION_PACK, "Last Names");
  const name = `${firstName} ${lastName}`;
  const imageBase = randomCharacterImageBase();
  const portrait = `systems/deathinspace/assets/images/portraits/characters/${imageBase}.jpg`;
  const token = `systems/deathinspace/assets/images/tokens/characters/${imageBase}.png`;

  // 1. abilities
  const body = generateAbilityValue();
  const dexterity = generateAbilityValue();
  const savvy = generateAbilityValue();
  const tech = generateAbilityValue();

  const defenseRating = 12 + dexterity;

  // 2. origin
  const origin = await drawDocument(CREATION_PACK, "Origins");
  const originBenefit = await pickOriginBenefit(origin);

  // 3. character details
  const background = await drawText(CREATION_PACK, "Backgrounds");
  const trait = await drawText(CREATION_PACK, "Traits");
  const drive = await drawText(CREATION_PACK, "Drives");
  const looks = await drawText(CREATION_PACK, "Looks");

  // 4. past allegiance
  const pastAllegiance = await drawText(CREATION_PACK, "Past Allegiances");

  // 5. hit points and defense rating
  const hitPoints = rollTotal("1d8");

  // 6. starting gear and starting bonus
  const holos = rollTotal("3d10");
  const startingKitItems = await drawDocuments(CREATION_PACK, "Starting Kits");
  const personalTrinket = await drawDocument(
    CREATION_PACK,
    "Personal Trinkets"
  );

  const items = [origin, originBenefit, personalTrinket].concat(
    startingKitItems
  );
  const itemData = items.map((d) => simpleData(d));

  const actorData = {
    name,
    data: {
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
};

const maybeGiveStartingBonus = async (actor) => {
  const sumOfAbilityScores =
    actor.system.abilities.body.value +
    actor.system.abilities.dexterity.value +
    actor.system.abilities.savvy.value +
    actor.system.abilities.tech.value;
  if (sumOfAbilityScores >= 0) {
    // no starting bonus
    return;
  }
  const bonusRoll = rollTotal("1d6");
  let bonusItem = null;
  let bonusHitPoints = 0;
  let bonusFollower = null;
  switch (bonusRoll) {
    case 1:
      bonusItem = await drawDocument(CREATION_PACK, "Cosmic Mutations");
      break;
    case 2:
      bonusHitPoints = 3;
      break;
    case 3:
      bonusItem = await documentFromPack(
        "deathinspace.armor",
        "EVA Suit - Heavy"
      );
      break;
    case 4:
      bonusItem = await documentFromPack("deathinspace.weapons", "Pistol");
      break;
    case 5:
      bonusFollower = await documentFromPack(
        "deathinspace.starting-npcs",
        "AI guard animal"
      );
      break;
    case 6:
      bonusFollower = await documentFromPack(
        "deathinspace.starting-npcs",
        "Old Crew Member"
      );
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
};

const rollTotal = (formula) => {
  const roll = new Roll(formula).evaluate({
    async: false,
  });
  return roll.total;
};

const generateAbilityValue = () => {
  return rollTotal("1d4") - rollTotal("1d4");
};

const pickOriginBenefit = async (origin) => {
  if (origin.system.benefitNames) {
    const names = origin.system.benefitNames.split(",");
    if (names.length) {
      const randName = names[Math.floor(Math.random() * names.length)];
      const pack = game.packs.get("deathinspace.origin-benefits");
      const docs = await pack.getDocuments();
      const benefit = docs.find((i) => i.name === randName);
      return benefit;
    }
  }
};

const randomCharacterImageBase = () => {
  // prefix for our portrait jpgs and token pngs
  const maxNum = 102;
  const randNum = Math.floor(Math.random() * maxNum) + 1;
  const padded = randNum.toString().padStart(2, "0");
  return `character_${padded}`;
};

export const generateSpacecraft = async () => {
  const defenseRating = 11;
  const maxCondition = 5;
  const fuelCapacity = 6;
  const name = await drawText("deathinspace.hub-creation", "Hub Names");
  const background = await drawText(
    "deathinspace.hub-creation",
    "Spacecraft Backgrounds"
  );
  const quirk = await drawText("deathinspace.hub-creation", "Hub Quirks");
  const actorData = {
    name,
    data: {
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
  const frame = await documentFromPack(
    "deathinspace.frames",
    "Starting spacecraft"
  );
  const engine = await documentFromPack(
    "deathinspace.power-systems",
    "Chemical engine"
  );
  await actor.createEmbeddedDocuments("Item", [
    simpleData(frame),
    simpleData(engine),
  ]);
  actor.sheet.render(true);
};

export const generateStation = async () => {
  const defenseRating = 11;
  const maxCondition = 5;
  const fuelCapacity = 4;
  const name = await drawText("deathinspace.hub-creation", "Hub Names");
  const background = await drawText(
    "deathinspace.hub-creation",
    "Station Backgrounds"
  );
  const quirk = await drawText("deathinspace.hub-creation", "Hub Quirks");
  const actorData = {
    name,
    data: {
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
  const frame = await documentFromPack(
    "deathinspace.frames",
    "Starting station"
  );
  const engine = await documentFromPack(
    "deathinspace.power-systems",
    "Industrial generator"
  );
  await actor.createEmbeddedDocuments("Item", [
    simpleData(frame),
    simpleData(engine),
  ]);
  actor.sheet.render(true);
};

export const generateNpc = async () => {
  const npc = await randomNpc();
  const actor = await DISActor.create(npc);
  actor.sheet.render(true);
};

export const regenerateNpc = async (actor) => {
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
};

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 *
 * https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
 */
const randomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomNpc = async () => {
  const firstName = await drawText(CREATION_PACK, "First Names");
  const lastName = await drawText(CREATION_PACK, "Last Names");
  const name = `${firstName} ${lastName}`;
  const imageBase = randomCharacterImageBase();
  const portrait = `systems/deathinspace/assets/images/portraits/characters/${imageBase}.jpg`;
  const token = `systems/deathinspace/assets/images/tokens/characters/${imageBase}.png`;

  // 1. abilities
  const body = generateAbilityValue();
  const dexterity = generateAbilityValue();
  const savvy = generateAbilityValue();
  const tech = generateAbilityValue();
  const morale = randomInt(4, 11);

  // 2. character details
  const background = await drawText(CREATION_PACK, "Backgrounds");
  const firstImpressions = await drawText(CREATION_PACK, "First Impressions");
  const looks = await drawText(CREATION_PACK, "Looks");

  // 3. hit points and defense rating
  const hitPoints = rollTotal("1d8");
  const defenseRating = 12 + dexterity;

  // 6. starting gear
  const holos = rollTotal("3d10");

  const actorData = {
    name,
    data: {
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
};
