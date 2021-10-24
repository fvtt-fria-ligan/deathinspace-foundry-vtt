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
      height: 680,
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
    html.find(".ability-name").on("click", this._onAbilityRoll.bind(this));
    html
      .find(".weapon-attack")
      .on("click", this._onWeaponRoll.bind(this));
    html
      .find(".weapon-damage")
      .on("click", this._onDamageRoll.bind(this));
    html.find(".add-belonging").click(this._onAddBelonging.bind(this));
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
      .filter((item) => item.type === CONFIG.DIS.itemTypes.armor)
      .sort(byName);
    sheetData.data.equipment = sheetData.items
      .filter((item) => item.type === CONFIG.DIS.itemTypes.equipment)
      .sort(byName);
    const allSlotItems = [
      ...sheetData.data.weapons,
      ...sheetData.data.armor,
      ...sheetData.data.equipment,
    ];
    sheetData.data.totalSlots = allSlotItems
      .map((item) => item.data.slots)
      .reduce((prev, next) => prev + next, 0);
    sheetData.data.maxSlots = 12 + sheetData.data.abilities.body.value;
  }

  /**
   * +Add for belongings tab
   */
  async _onAddBelonging(event) {
    console.log("_onAddBelonging ****");
    event.preventDefault();
    const template =
      "systems/deathinspace/templates/dialog/add-item-dialog.html";
    let dialogData = {
      config: CONFIG.DeathInSpace,
    };
    const html = await renderTemplate(template, dialogData);
    return new Promise((resolve) => {
      new Dialog({
        title: game.i18n.localize("Create New Item"),
        content: html,
        buttons: {
          create: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize("Create New Item"),
            callback: (html) =>
              resolve(_createBelongingItem(this.actor, html[0].querySelector("form"))),
          },
        },
        default: "create",
        close: () => resolve(null),
      }).render(true);
    });
  }

  _onAbilityRoll(event) {
    event.preventDefault();
    const ability = event.target.getAttribute("data-ability");
    this.actor.rollAbilityCheck(ability);
  }

  _onWeaponRoll(event) {
    event.preventDefault();
    const row = $(event.currentTarget).parents(".item");
    const itemId = row.data("itemId");
    this.actor.rollItemAttack(itemId);
  }

  _onDamageRoll(event) {
    event.preventDefault();
    const row = $(event.currentTarget).parents(".item");
    const itemId = row.data("itemId");
    this.actor.rollItemDamage(itemId);
  }
}

/**
 * Create a new Owned Item for the given actor, based on the name/type from the form.
 */
const _createBelongingItem = (actor, form) => {
  const itemData = {
    name: form.itemname.value,
    type: form.itemtype.value,
    data: {},
  };
  actor.createEmbeddedDocuments("Item", [itemData]);
};
