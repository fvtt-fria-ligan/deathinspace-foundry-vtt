/**
 * Death in Space module.
 */

import { DISActor } from "./actor/actor.js";
import { DISCharacterSheet } from "./actor/sheet/character-sheet.js";
import { DISHubSheet } from "./actor/sheet/hub-sheet.js";
import { DISNpcSheet } from "./actor/sheet/npc-sheet.js";
import { DIS } from "./config.js";
import {
  generateCharacter,
  generateNpc,
  generateSpacecraft,
  generateStation,
} from "./generator.js";
import { configureHandlebars } from "./handlebars.js";
import { DISItem } from "./item/item.js";
import { DISItemSheet } from "./item/sheet/item-sheet.js";

/**
 * Init hook.
 */
Hooks.once("init", async function () {
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
  foundry.documents.collections.Actors.unregisterSheet(
    "core",
    foundry.appv1.sheets.ActorSheet,
  );
  foundry.documents.collections.Actors.registerSheet(
    "deathinspace",
    DISCharacterSheet,
    {
      types: ["character"],
      makeDefault: true,
      label: "DIS.SheetClassCharacter",
    },
  );
  foundry.documents.collections.Actors.registerSheet(
    "deathinspace",
    DISHubSheet,
    {
      types: ["hub"],
      makeDefault: true,
      label: "DIS.SheetClassHub",
    },
  );
  foundry.documents.collections.Actors.registerSheet(
    "deathinspace",
    DISNpcSheet,
    {
      types: ["npc"],
      makeDefault: true,
      label: "DIS.SheetClassNpc",
    },
  );
  foundry.documents.collections.Items.unregisterSheet(
    "core",
    foundry.appv1.sheets.ItemSheet,
  );
  foundry.documents.collections.Items.registerSheet(
    "deathinspace",
    DISItemSheet,
    { makeDefault: true },
  );

  configureHandlebars();
});

Hooks.on("renderActorDirectory", (app, html) => {
  if (game.user.can("ACTOR_CREATE")) {
    // only show the Create Scvm button to users who can create actors
    const section = document.createElement("header");
    section.classList.add("generate-character");
    section.classList.add("directory-header");
    // Add menu before directory header
    const dirHeader = $(html)[0].querySelector(".directory-header");
    dirHeader.parentNode.insertBefore(section, dirHeader);
    section.insertAdjacentHTML(
      "afterbegin",
      `
      <div class="header-actions action-buttons flexrow">
        <button class="generate-character-button"><i class="fas fa-user-astronaut"></i>${game.i18n.localize(
          "DIS.GenerateCharacter",
        )}</button>
      </div>
      <div class="header-actions action-buttons flexrow">
        <button class="generate-npc-button"><i class="fas fa-user"></i>${game.i18n.localize(
          "DIS.GenerateNpc",
        )}</button>
      </div>
      <div class="header-actions action-buttons flexrow">
        <button class="generate-spacecraft-button"><i class="fas fa-rocket"></i>${game.i18n.localize(
          "DIS.GenerateSpacecraft",
        )}</button>
      </div>
      <div class="header-actions action-buttons flexrow">
        <button class="generate-station-button"><i class="fas fa-satellite"></i>${game.i18n.localize(
          "DIS.GenerateStation",
        )}</button>
      </div>
      `,
    );
    section
      .querySelector(".generate-character-button")
      .addEventListener("click", () => {
        generateCharacter();
      });
    section
      .querySelector(".generate-npc-button")
      .addEventListener("click", () => {
        generateNpc();
      });
    section
      .querySelector(".generate-spacecraft-button")
      .addEventListener("click", () => {
        generateSpacecraft();
      });
    section
      .querySelector(".generate-station-button")
      .addEventListener("click", () => {
        generateStation();
      });
  }
});
