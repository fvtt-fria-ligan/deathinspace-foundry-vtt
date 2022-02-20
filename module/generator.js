import { DISActor } from "./actor/actor.js";

export const generateCharacter = async () => {
  const creationPack = "deathinspace.character-creation";

  // 1. abilities
  const body = generateAbilityValue();
  const dexterity = generateAbilityValue();
  const savvy = generateAbilityValue();
  const tech = generateAbilityValue();

  const defenseRating = 12 + dexterity;

  // 2. origin
  const origin = await drawDocument(creationPack, "Origins");
  const originBenefit = await pickOriginBenefit(origin);

  // 3. character details
  const background = await drawText(creationPack, "Backgrounds");
  const trait = await drawText(creationPack, "Traits");
  const drive = await drawText(creationPack, "Drives");
  const looks = await drawText(creationPack, "Looks");

  // 4. past allegiance
  const pastAllegiance = await drawText(creationPack, "Past Allegiances");

  // 5. hit points and defense rating
  const hitPoints = rollTotal("1d8");

  // 6. starting gear and starting bonus
  const holos = rollTotal("3d10");
  // TODO: need to handle multiple results/docs drawn
  //const startingKit = await drawResult(creationPack, "Starting Kits");
  // TODO: extract entities

  const sumOfAbilityScores = body + dexterity + savvy + tech;
  let startingBonus = null;
  if (sumOfAbilityScores < 0) {
    // startingBonus = drawResult("deathinspace.character-creation", "Starting Bonuses");
  }
  const personalTrinket = await drawDocument(creationPack, "Personal Trinkets");

  const firstName = await drawText(creationPack, "First Names");
  const lastName = await drawText(creationPack, "Last Names");

  const actorData = {
    name: `${firstName} ${lastName}`,
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
    type: "character",    
  };
  const actor = await DISActor.create(actorData);

  // TODO: apply starting bonus to character

  // TODO: originBenefit
  await actor.createEmbeddedDocuments("Item", [origin.data, originBenefit.data, personalTrinket.data])
  actor.sheet.render(true);

  return actor;
}

const rollTotal = (formula) => {
  const roll = new Roll(formula).evaluate({
    async: false,
  });
  return roll.result;
};

const generateAbilityValue = () => {
  return rollTotal("1d4") - rollTotal("1d4");
};

const pickOriginBenefit = async (origin) => {
  console.log(origin);
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
  return Promise.all(draw.results.map(r => documentFromResult(r)));
};

const documentFromDraw = async (draw) => {
  const doc = await documentFromResult(draw.results[0]);
  return doc;
};

const documentFromResult = async (result) => {
  const collectionName = result.data.type === 2
        ? "Compendium." + result.data.collection
        : result.data.collection;
  const uuid = `${collectionName}.${result.data.resultId}`;
  const doc = await fromUuid(uuid);
  return doc;
};

const generateSpacecraft = async () => {

};

const generateStation = async () => {

};
