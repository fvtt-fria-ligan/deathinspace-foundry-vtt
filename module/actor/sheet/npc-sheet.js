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
      height: 648,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "personal",
        },
      ],
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }],
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".weapon-attack").on("click", this._onWeaponRoll.bind(this));
    html.find(".weapon-damage").on("click", this._onDamageRoll.bind(this));
    html.find(".add-belonging").click(this._onAddBelonging.bind(this));
    html.find("a.item-equip").click(this._onEquipToggle.bind(this));
    html.find(".item-condition").click(this._onItemConditionCheck.bind(this));
    html
      .find(".morale-name.rollable")
      .on("click", this._onMoraleRoll.bind(this));
    html.find("a.reaction").on("click", this._onReactionRoll.bind(this));
  }

  /** @override */
  getData() {
    const superData = super.getData();
    const data = superData.data;
    data.config = CONFIG.DIS;
    this.prepareNpcItems(data);
    return superData;
  }

  prepareNpcItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    sheetData.system.origin = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.origin)
      .pop();
    sheetData.system.weapons = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.weapon)
      .sort(byName);
    sheetData.system.armor = sheetData.items
      .filter((item) => {
        return (
          item.type === CONFIG.DIS.itemTypes.armor &&
          (!item.data.equippable || item.data.equipped)
        );
      })
      .sort(byName);
    sheetData.system.equipment = sheetData.items
      .filter((item) => {
        return (
          item.type === CONFIG.DIS.itemTypes.equipment ||
          (item.type === CONFIG.DIS.itemTypes.armor &&
            item.data.equippable &&
            !item.data.equipped)
        );
      })
      .sort(byName);
    const allSlotItems = [
      ...sheetData.system.weapons,
      ...sheetData.system.armor,
      ...sheetData.system.equipment,
    ];
    sheetData.system.totalSlots = allSlotItems
      .map((item) =>
        item.system.equippable
          ? item.system.equipped
            ? 0
            : item.system.slots
          : item.system.slots
      )
      .reduce((prev, next) => prev + next, 0);
    sheetData.system.maxSlots = 12 + sheetData.system.abilities.body.value;
  }

  _onMoraleRoll(event) {
    event.preventDefault();
    this.actor.rollNpcMorale();
  }

  _onReactionRoll(event) {
    event.preventDefault();
    this.actor.rollNpcReaction();
  }
}
