import { DIS } from "../../config.js";

/*
 * @extends {ItemSheet}
 */
export class DISItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
      return mergeObject(super.defaultOptions, {
        classes: ["deathinspace", "sheet", "item"],
        template: "systems/deathinspace/templates/item/item-sheet.html",
        width: 730,
        height: 680,
        tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "data"}],
        dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
      });
    }
  
    /** @override */
    activateListeners(html) {
      super.activateListeners(html);
    }

  }
  