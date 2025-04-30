export default class AttackDialog extends Application {
  /** @override */
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = "attack-dialog";
    options.classes = ["deathinspace"];
    options.title = game.i18n.localize("DIS.Attack");
    options.template =
      "systems/deathinspace/templates/dialog/attack-dialog.html";
    options.width = 420;
    options.height = "auto";
    return options;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".attack-button").click(this._onAttack.bind(this));
    html
      .find("input[name=use-void-point]")
      .change(this._onUseVoidPointChange.bind(this));
  }

  /** @override */
  async getData() {
    let defenderDR = 12; // default

    let target = Array.from(game.user.targets)[0];
    if (target) {
      //If target is selected, use target defense rating
      let targetActorId = target.document.actorId;
      let targetActor = game.actors.get(targetActorId);
      defenderDR = targetActor.system.defenseRating;
    }
	
    return {
      defenderDR,
      hasVoidPoints: this.actor.hasVoidPoints,
      voidPointsClass: this.actor.hasVoidPoints ? "enabled" : "disabled",
    };
  }

  _onUseVoidPointChange(event) {
    event.preventDefault();
    const useVoidPoint = $(event.currentTarget).is(":checked");
    if (useVoidPoint) {
      $("input[name=roll-type][value=advantage]").prop("checked", true);
    } else {
      $("input[name=roll-type][value=normal]").prop("checked", true);
    }
  }

  async _onAttack(event) {
    event.preventDefault();
    const form = $(event.currentTarget).parents(".attack-dialog")[0];
    const defenderDRStr = $(form).find("input[name=defender-dr]").val();
    const defenderDR = parseInt(defenderDRStr);
    const rollType = $(form).find("input[name=roll-type]:checked").val();
    const risky = $(form).find("input[name=risky]").is(":checked");
    const useVoidPoint = $(form)
      .find("input[name=use-void-point]")
      .is(":checked");
    this.close();

    if (this.itemId) {
      this.actor.rollAttackWithItem(
        this.itemId,
        defenderDR,
        rollType,
        risky,
        useVoidPoint
      );
    } else {
      this.actor.rollAttack(
        this.attackName,
        this.attackAbility,
        this.attackDamage,
        defenderDR,
        rollType,
        risky,
        useVoidPoint
      );
    }
  }
}
