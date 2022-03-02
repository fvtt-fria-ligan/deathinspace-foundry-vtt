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
      height: 742,
      tabs: [{navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "data"}],
      dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}]
    });
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".ability.rollable").on("click", this._onAbilityRoll.bind(this));
    html.find(".morale.rollable").on("click", this._onMoraleRoll.bind(this));
    html.find(".attack.rollable").on("click", this._onAttackRoll.bind(this));
    html.find(".damage.rollable").on("click", this._onDamageRoll.bind(this));
  }  

  _onAbilityRoll(event) {
    event.preventDefault();
    const ability = event.target.getAttribute("data-ability");
    this.actor.rollAbilityCheck(ability);
  }

  _onMoraleRoll(event) {
    event.preventDefault();
    this.actor.rollNpcMorale();
  }

  _onAttackRoll(event) {
    event.preventDefault();
    this.actor.showAttackDialog(this.actor.data.data.attackName, this.actor.data.data.attackAbility, this.actor.data.data.attackDamage);
  }

  _onDamageRoll(event) {
    event.preventDefault();
    this.actor.rollNpcDamage();
  }
}