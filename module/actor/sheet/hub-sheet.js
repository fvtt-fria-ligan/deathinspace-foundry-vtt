import DISActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class DISHubSheet extends DISActorSheet {

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
    const superData = super.getData();
    const data = superData.data;
    const byName = (a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
    data.data.powerSystem = data.items.filter(item => item.type === CONFIG.DIS.itemTypes.powerSystem).pop();
    data.data.hubModules = data.items.filter(item => item.type === "hubModule").sort(byName);
    data.data.totalPowerCost = data.data.hubModules.reduce((a, b) => a + parseInt(b.data.powerCost), 0);  
    return superData;
  }  
}
  