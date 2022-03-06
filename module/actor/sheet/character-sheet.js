import DISActorSheet from "./actor-sheet.js";

/**
 * @extends {ActorSheet}
 */
export class DISCharacterSheet extends DISActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
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
    html.find("a.regenerate").click(this._onRegenerate.bind(this));
    html.find("a.item-equip").click(this._onEquipToggle.bind(this));
    html.find(".item-condition").click(this._onItemConditionCheck.bind(this));
  }

  /** @override */
  getData() {
    const superData = super.getData();
    const data = superData.data;
    data.config = CONFIG.DIS;
    this.prepareCharacterItems(data);
    return superData;
  }

  prepareCharacterItems(sheetData) {
    const byName = (a, b) => (a.name > b.name ? 1 : b.name > a.name ? -1 : 0);
    sheetData.data.origin = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.origin)
      .pop();
    sheetData.data.originBenefits = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.originBenefit)
      .sort(byName);
    sheetData.data.cosmicMutations = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.cosmicMutation)
      .sort(byName);
    sheetData.data.voidCorruptions = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.voidCorruption)
      .sort(byName);
    sheetData.data.weapons = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.weapon)
      .sort(byName);
    sheetData.data.armor = sheetData.items
      .filter((item) => {
        return (
          item.type === CONFIG.DIS.itemTypes.armor &&
          (!item.data.equippable || item.data.equipped)
        );
      })
      .sort(byName);
    sheetData.data.equipment = sheetData.items
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
      ...sheetData.data.weapons,
      ...sheetData.data.armor,
      ...sheetData.data.equipment,
    ];
    sheetData.data.totalSlots = allSlotItems
      .map((item) =>
        item.data.equippable
          ? item.data.equipped
            ? 0
            : item.data.slots
          : item.data.slots
      )
      .reduce((prev, next) => prev + next, 0);
    sheetData.data.maxSlots = 12 + sheetData.data.abilities.body.value;
  }

  _onRegenerate(event) {
    event.preventDefault();
    // confirm before regenerating
    const d = new Dialog({
      title: game.i18n.localize("DIS.Regenerate"),
      content: `<p>${game.i18n.localize("DIS.RegenerateWarning")}`,
      buttons: {
        cancel: {
          label: game.i18n.localize("DIS.Cancel"),
        },
        getbetter: {
          icon: '<i class="fas fa-skull"></i>',
          label: game.i18n.localize("DIS.Regenerate"),
          callback: () => this.actor.regenerate(),
        },
      },
      default: "cancel",
    });
    d.render(true);
  }
}
