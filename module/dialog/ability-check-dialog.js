export default class AbilityCheckDialog extends Application {
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "ability-check-dialog";
    options.classes = ["deathinspace"];
    options.title = game.i18n.localize("DIS.AbilityCheck");
    options.template = "systems/deathinspace/templates/dialog/ability-check-dialog.html";
    options.width = 420;
    options.height = "auto";
    return options;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
     html.find(".ability-check-button").click(this._onAbilityCheck.bind(this));
  }

  _onAbilityCheck(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".ability-check-dialog")[0];
    // const defenderDRStr = $(form).find("input[name=defender-dr]").val();
    // const defenderDR = parseInt(defenderDRStr);
    const rollType = $(form)
      .find("input[name=roll-type]:checked")
      .val();
    const opposed = $(form).find("input[name=opposed]").is(":checked");
    this.close();
    this.actor.rollAbilityCheck(this.ability, rollType, opposed);
  }
}
