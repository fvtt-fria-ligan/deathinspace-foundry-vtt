/**
 * @extends {ActorSheet}
 */
export class DISHubSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["deathinspace", "sheet", "actor", "hub"],
      template: "systems/deathinspace/templates/actor/hub-sheet.html",
      width: 730,
      height: 680,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "specifics"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }

  /** @override */
  getData() {
    const data = super.getData();
    // TODO: filter items etc
    data.actor.data.cargo = data.items;
    return data;
  }  
}
  