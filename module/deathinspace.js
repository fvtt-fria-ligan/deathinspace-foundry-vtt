/**
 * Death in Space module.
 */

import { DISActor } from "./actor/actor.js";
import { DISCharacterSheet } from "./actor/sheet/character-sheet.js";
import { DISHubSheet } from "./actor/sheet/hub-sheet.js";
import { DISNpcSheet } from "./actor/sheet/npc-sheet.js";
import { DIS } from "./config.js";
import { generateCharacter, generateSpacecraft, generateStation } from "./generator.js";
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
  CONFIG.Actor.documentClass = DISActor;
  CONFIG.Item.documentClass = DISItem;

  game.gen = generateCharacter; // DEBUGGING

  CONFIG.DIS = DIS;
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("deathinspace", DISCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "DIS.SheetClassCharacter"
  });
  Actors.registerSheet("deathinspace", DISHubSheet, {
    types: ["hub"],
    makeDefault: true,
    label: "DIS.SheetClassHub"
  });
  Actors.registerSheet("deathinspace", DISNpcSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "DIS.SheetClassNpc"
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("deathinspace", DISItemSheet, { makeDefault: true });
});

Hooks.on("renderActorDirectory", (app, html) => {
  if (game.user.can("ACTOR_CREATE")) {
    // only show the Create Scvm button to users who can create actors
    const section = document.createElement("header");
    section.classList.add("generate-character");
    section.classList.add("directory-header");
    // Add menu before directory header
    const dirHeader = html[0].querySelector(".directory-header");
    dirHeader.parentNode.insertBefore(section, dirHeader);
    section.insertAdjacentHTML(
      "afterbegin",
      `
      <div class="header-actions action-buttons flexrow">
        <button class="generate-character-button"><i class="fas fa-user"></i>${game.i18n.localize('DIS.GenerateCharacter')}</button>
      </div>
      <div class="header-actions action-buttons flexrow">
        <button class="generate-spacecraft-button"><i class="fas fa-rocket"></i>${game.i18n.localize('DIS.GenerateSpacecraft')}</button>
      </div>
      <div class="header-actions action-buttons flexrow">
        <button class="generate-station-button"><i class="fas fa-satellite"></i>${game.i18n.localize('DIS.GenerateStation')}</button>
      </div>
      `
    );
    section
      .querySelector(".generate-character-button")
      .addEventListener("click", () => { generateCharacter() });
    section
      .querySelector(".generate-spacecraft-button")
      .addEventListener("click", () => { generateSpacecraft() });
    section
      .querySelector(".generate-station-button")
      .addEventListener("click", () => { generateStation() });
  }
});

// TODO: can we just use Foundry's "eq" helper? verify.
Handlebars.registerHelper('ifEq', function(arg1, arg2, options) {
  // TODO: verify whether we want == or === for this equality check
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper("add", function (num1, num2){
  return num1 + num2;
});
