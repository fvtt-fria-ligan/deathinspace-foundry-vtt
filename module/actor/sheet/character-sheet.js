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
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "personal"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".ability-name").on("click", this._onAbilityRoll.bind(this));
  }

  /** @override */
  getData() {
    const superData = super.getData();
    const data = superData.data;
    data.config = CONFIG.DIS;

    // Ability Scores
    // for (let [a, abl] of Object.entries(data.data.abilities)) {
    //   const translationKey = CONFIG.MB.abilities[a];
    //   abl.label = game.i18n.localize(translationKey);
    // }

    this.prepareCharacterItems(data);
    return superData;
  }  

  prepareCharacterItems(sheetData) {
    const byName = (a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0);
    sheetData.data.origin = sheetData.items.filter(item => item.type === CONFIG.DIS.itemTypes.origin).pop();
    sheetData.data.originBenefits = sheetData.items.filter(item => item.type === CONFIG.DIS.itemTypes.originBenefit).sort(byName);
    sheetData.data.cosmicMutations = sheetData.items.filter(item => item.type === CONFIG.DIS.itemTypes.cosmicMutation).sort(byName);
    sheetData.data.voidCorruptions = sheetData.items.filter(item => item.type === CONFIG.DIS.itemTypes.voidCorruption).sort(byName);
    sheetData.data.weapons = sheetData.items.filter(item => item.type === CONFIG.DIS.itemTypes.weapon).sort(byName);
    sheetData.data.armor = sheetData.items.filter(item => item.type === CONFIG.DIS.itemTypes.armor).sort(byName);
    sheetData.data.equipment = sheetData.items.filter(item => item.type === CONFIG.DIS.itemTypes.equipment).sort(byName);

    //sheetData.data.belongings = [...sheetData.data.weapons, ...sheetData.data.armor, ...sheetData.data.equipment].sort(byName);
  }

  _onAbilityRoll(event) {
    event.preventDefault();
    const ability = event.target.getAttribute("data-ability");
    this.actor.abilityCheck(ability);
  }  
}
