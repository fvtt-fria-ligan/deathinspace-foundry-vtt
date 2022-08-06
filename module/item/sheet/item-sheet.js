/*
 * @extends {ItemSheet}
 */
export class DISItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["deathinspace", "sheet", "item"],
      width: 730,
      height: 680,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "notes",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  /** @override */
  get template() {
    const path = "systems/deathinspace/templates/item";
    // specific item-type sheet
    return `${path}/${this.item.type}-sheet.html`;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
  }
}
