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
    const superData = super.getData();
    const data = superData.data;
    const byName = (a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
    data.data.cargo = data.items.filter(item => item.type === "cargo").sort(byName);
    data.data.hubModules = data.items.filter(item => item.type === "hubModule").sort(byName);
    data.data.totalPowerCost = data.data.hubModules.reduce((a, b) => a.powerCost + b.powerCost, 0);
  
    // TODO: calculate this somehow from power source?
    data.data.outputPower = 33;
  
    console.log(superData);
    return superData;
  }  
}
  