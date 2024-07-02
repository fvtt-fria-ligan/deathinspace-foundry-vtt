import DISActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class DISCharacterSheet extends DISActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["deathinspace", "sheet", "actor", "character"],
      template: "systems/deathinspace/templates/actor/character-sheet.html",
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
  }

  /** @override */
  async getData() {
    const superData = await super.getData();
    const data = superData.data;
    data.config = CONFIG.DIS;
    this.prepareCharacterItems(data);
    return superData;
  }

  prepareCharacterItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    sheetData.system.origin = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.origin)
      .pop();
    sheetData.system.originBenefits = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.originBenefit)
      .sort(byName);
    sheetData.system.cosmicMutations = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.cosmicMutation)
      .sort(byName);
    sheetData.system.voidCorruptions = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.voidCorruption)
      .sort(byName);
    sheetData.system.weapons = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.weapon)
      .sort(byName);
    sheetData.system.armor = sheetData.items
      .filter((item) => {
        return (
          item.type === CONFIG.DIS.itemTypes.armor &&
          (!item.system.equippable || item.system.equipped)
        );
      })
      .sort(byName);
    sheetData.system.equipment = sheetData.items
      .filter((item) => {
        return (
          item.type === CONFIG.DIS.itemTypes.equipment ||
          (item.type === CONFIG.DIS.itemTypes.armor &&
            item.system.equippable &&
            !item.system.equipped)
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
}
