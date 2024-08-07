import DISActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class DISHubSheet extends DISActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["deathinspace", "sheet", "actor", "hub"],
      template: "systems/deathinspace/templates/actor/hub-sheet.html",
      width: 730,
      height: 694,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "specifics",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }

  /** @override */
  async getData() {
    const superData = await super.getData();
    const data = superData.data;
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    data.system.frame = data.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.frame)
      .pop();
    data.system.powerSystem = data.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.powerSystem)
      .pop();
    data.system.hubModules = data.items
      .filter((item) => item.type === "hubModule")
      .sort(byName);
    data.system.totalPowerCost = data.system.hubModules.reduce(
      (a, b) => a + parseInt(b.system.powerCost),
      0
    );
    return superData;
  }
}
