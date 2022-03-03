export default class AttackDialog extends Application {
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "attack-dialog";
    options.classes = ["deathinspace"];
    options.title = game.i18n.localize("DIS.Attack");
    options.template = "systems/deathinspace/templates/actor/attack-dialog.html";
    options.width = 420;
    options.height = "auto";
    return options;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".attack-button").click(this._onAttack.bind(this));
  }

  _onAttack(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".attack-dialog")[0];
    const defenderDRStr = $(form).find("input[name=defender-dr]").val();
    const defenderDR = parseInt(defenderDRStr);
    const rollType = $(form)
      .find("input[name=roll-type]:checked")
      .val();
    const risky = $(form).find("input[name=risky]").is(":checked");
    this.close();
    if (this.itemId) {
      this.actor.rollAttackWithItem(this.itemId, defenderDR, rollType, risky);
    } else {
      this.actor.rollAttack(this.attackName, this.attackAbility, this.attackDamage, defenderDR, rollType, risky);
    }
  }
}
