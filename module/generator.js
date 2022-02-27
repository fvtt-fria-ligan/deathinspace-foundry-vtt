import { DISActor } from "./actor/actor.js";

const CREATION_PACK = "deathinspace.character-creation";

export const generateCharacter = async () => {
  const char = await randomCharacter();
  const actor = await DISActor.create(char.actorData);
  await actor.createEmbeddedDocuments("Item", char.items);
  await maybeGiveStartingBonus(actor);
  actor.sheet.render(true);
};

export const regenerateCharacter = async (actor) => {
  const char = await randomCharacter();
  await actor.deleteEmbeddedDocuments("Item", [], { deleteAll: true });
  await actor.update(char.actorData);
  await actor.createEmbeddedDocuments("Item", char.items);
  await maybeGiveStartingBonus(actor);
  // update any actor tokens in the scene, too
  for (const token of actor.getActiveTokens()) {
    await token.document.update({
      img: actor.data.token.img,
      name: actor.name
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
  const personalTrinket = await drawDocument(CREATION_PACK, "Personal Trinkets");

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
    token: {
      img: token,
      name
    },
    type: "character",    
  };
  const items = [origin.data, originBenefit.data, personalTrinket.data].concat(startingKitItems.map(x => x.data));

  return {
    actorData,
    items
  };
}

const maybeGiveStartingBonus = async (actor) => {
  const sumOfAbilityScores = (
    actor.data.data.abilities.body.value + 
    actor.data.data.abilities.dexterity.value + 
    actor.data.data.abilities.savvy.value + 
    actor.data.data.abilities.tech.value);
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
      bonusItem = await documentFromPack("deathinspace.armor", "EVA Suit - Heavy");
      break;
    case 4:
      bonusItem = await documentFromPack("deathinspace.weapons", "Pistol");
      break;
    case 5:
      bonusFollower = await documentFromPack("deathinspace.starting-npcs", "AI guard animal");
      break;
    case 6:
      bonusFollower = await documentFromPack("deathinspace.starting-npcs", "Old Crew Member");
      break;    
  }

  if (bonusItem) {    
    await actor.createEmbeddedDocuments("Item", [bonusItem.data])
  }
  if (bonusHitPoints) {
    const newHP = actor.data.data.hitPoints.max + bonusHitPoints;
    await actor.update({ 
      ["data.hitPoints.max"]: newHP,
      ["data.hitPoints.value"]: newHP 
    });
  }
  if (bonusFollower) {
    // TODO: randomize follower stats
    const followerData = duplicate(bonusFollower.data);
    const firstName = actor.name.split(" ")[0];
    followerData.name = `${firstName}'s ${followerData.name}`;
    const follower = await DISActor.create(followerData);
    follower.sheet.render(true);
    // TODO: set notes on char sheet?
    // "You have a starting follower: "
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
  if (origin.data.data.benefitNames) {
    const names = origin.data.data.benefitNames.split(",");
    if (names.length) {
      const randName = names[Math.floor(Math.random() * names.length)];
      const pack = game.packs.get("deathinspace.origin-benefits");
      const docs = await pack.getDocuments();  
      const benefit = docs.find(
        (i) => i.name === randName
      );
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
}

const documentFromPack = async (packName, docName) => {
  const pack = game.packs.get(packName);
  const docs = await pack.getDocuments();
  const doc = docs.find(
    (i) => i.name === docName
  );
  return doc;
};

const drawFromTable = async (packName, tableName) => {
  const creationPack = game.packs.get(packName);
  const creationDocs = await creationPack.getDocuments();
  const table = creationDocs.find(
    (i) => i.name === tableName
  );
  const tableDraw = await table.draw({ displayChat: false });
  // TODO: decide if/how we want to handle multiple results
  return tableDraw;
}

const drawText = async (packName, tableName) => {
  const draw = await drawFromTable(packName, tableName);
  return draw.results[0].data.text;
};

const drawDocument = async (packName, tableName) => {
  const draw = await drawFromTable(packName, tableName);
  const doc = await documentFromDraw(draw);
  return doc;
};

const drawDocuments = async (packName, tableName) => {
  const draw = await drawFromTable(packName, tableName);
  const docs = await documentsFromDraw(draw);
  return docs;
};

const documentsFromDraw = async (draw) => {
  const docResults = draw.results.filter(r => r.data.type === 2);
  return Promise.all(docResults.map(r => documentFromResult(r)));
};

const documentFromDraw = async (draw) => {
  const doc = await documentFromResult(draw.results[0]);
  return doc;
};

const documentFromResult = async (result) => {
  if (!result.data.collection) {
    console.log("No data.collection for result; skipping");
    return;
  }
  const collectionName = result.data.type === 2
        ? "Compendium." + result.data.collection
        : result.data.collection;
  const uuid = `${collectionName}.${result.data.resultId}`;
  const doc = await fromUuid(uuid);
  return doc;
};

export const generateSpacecraft = async () => {
  const defenseRating = 11;
  const maxCondition = 5;
  const fuelCapacity = 6;
  const name = await drawText("deathinspace.hub-creation", "Hub Names");
  const background = await drawText("deathinspace.hub-creation", "Spacecraft Backgrounds");
  const quirk = await drawText("deathinspace.hub-creation", "Hub Quirks");
  const actorData = {
    name,
    data: {
      background,
      condition: {
        max: maxCondition,
        value: maxCondition
      },
      fuel: {
        max: fuelCapacity,
        value: fuelCapacity
      },
      defenseRating,
      quirks: quirk
    },
    img: "systems/deathinspace/assets/images/icons/frames/frame-spacecraft.png",
    type: "hub"
  };
  const actor = await DISActor.create(actorData);
  const frame = await documentFromPack("deathinspace.frames", "Starting spacecraft");
  const engine = await documentFromPack("deathinspace.power-systems", "Chemical engine");
  await actor.createEmbeddedDocuments("Item", [frame.data, engine.data]);
  actor.sheet.render(true);
};

export const generateStation = async () => {
  const defenseRating = 11;
  const maxCondition = 5;
  const fuelCapacity = 4;
  const name = await drawText("deathinspace.hub-creation", "Hub Names");
  const background = await drawText("deathinspace.hub-creation", "Station Backgrounds");
  const quirk = await drawText("deathinspace.hub-creation", "Hub Quirks");
  const actorData = {
    name,
    data: {
      background,
      condition: {
        max: maxCondition,
        value: maxCondition
      },
      fuel: {
        max: fuelCapacity,
        value: fuelCapacity
      },
      defenseRating,
      quirks: quirk
    },
    img: "systems/deathinspace/assets/images/icons/frames/frame-station.png",
    type: "hub"
  };
  const actor = await DISActor.create(actorData);
  const frame = await documentFromPack("deathinspace.frames", "Starting station");
  const engine = await documentFromPack("deathinspace.power-systems", "Industrial generator");
  await actor.createEmbeddedDocuments("Item", [frame.data, engine.data]);
  actor.sheet.render(true);  
};
