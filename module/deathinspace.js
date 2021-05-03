/**
 * Death in Space module.
 */

import { DISActor } from "./actor/actor.js";
import { DISCharacterSheet } from "./actor/sheet/character-sheet.js";
import { DIS } from "./config.js";
import { DISItem } from "./item/item.js";
import { DISItemSheet } from "./item/sheet/item-sheet.js";

/**
 * Init hook.
 */
Hooks.once("init", async function() {
  console.log(`Initializing Death in Space System`);
  game.deathinspace = {
    config: DIS,
    DISActor,
    DISItem,
  };
  CONFIG.Actor.entityClass = DISActor;
  CONFIG.Item.entityClass = DISItem;
  CONFIG.DIS = DIS;
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("deathinspace", DISCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "DIS.SheetClassCharacter"
  });
});
