export const documentFromPack = async (packName, docName) => {
  const pack = game.packs.get(packName);
  const docs = await pack.getDocuments();
  const doc = docs.find((i) => i.name === docName);
  return doc;
};

export const tableFromPack = async (packName, tableName) => {
  const creationPack = game.packs.get(packName);
  const creationDocs = await creationPack.getDocuments();
  const table = creationDocs.find((i) => i.name === tableName);
  return table;
};

export const drawFromTable = async (packName, tableName) => {
  const table = await tableFromPack(packName, tableName);
  const tableDraw = await table.draw({ displayChat: false });
  // TODO: decide if/how we want to handle multiple results
  return tableDraw;
};

export const drawText = async (packName, tableName) => {
  const draw = await drawFromTable(packName, tableName);
  return draw.results[0].text;
};

export const drawDocument = async (packName, tableName) => {
  const draw = await drawFromTable(packName, tableName);
  const doc = await documentFromDraw(draw);
  return doc;
};

export const drawDocuments = async (packName, tableName) => {
  const draw = await drawFromTable(packName, tableName);
  const docs = await documentsFromDraw(draw);
  return docs;
};

export const documentsFromDraw = async (draw) => {
  const docResults = draw.results.filter((r) => r.type === 2);
  return Promise.all(docResults.map((r) => documentFromResult(r)));
};

export const documentFromDraw = async (draw) => {
  const doc = await documentFromResult(draw.results[0]);
  return doc;
};

export const documentFromResult = async (result) => {
  if (!result.documentCollection) {
    console.log("No documentCollection for result; skipping");
    return;
  }
  const collectionName =
    result.type === 2
      ? "Compendium." + result.documentCollection
      : result.documentCollection;
  const uuid = `${collectionName}.${result.documentId}`;
  const doc = await fromUuid(uuid);
  if (!doc) {
    console.log(`Could not find ${uuid}`);
  }
  return doc;
};

export const simpleData = (doc) => {
  return {
    id: doc.id,
    img: doc.img,
    name: doc.name,
    system: doc.system,
    type: doc.type,
  };
};

export const dupeData = (doc) => {
  return {
    data: doc.system,
    img: doc.img,
    name: doc.name,
    type: doc.type,
  };
};
