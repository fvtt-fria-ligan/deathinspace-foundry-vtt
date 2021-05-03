/**
 * @extends {ActorSheet}
 */
export class DISCharacterSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["deathinspace", "sheet", "actor", "character"],
      template: "systems/deathinspace/templates/actor/character-sheet.html",
      width: 720,
      height: 680,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "notes"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    console.log("***********************");
  }

}
