import DISActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class DISNpcSheet extends DISActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["deathinspace", "sheet", "actor", "npc"],
      template: "systems/deathinspace/templates/actor/npc-sheet.html",
      width: 730,
      height: 680,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "data"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }
}