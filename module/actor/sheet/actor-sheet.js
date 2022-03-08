/**
 * @extends {ActorSheet}
 */
export default class DISActorSheet extends ActorSheet {
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".item-create").click(this._onItemCreate.bind(this));
    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));
    html.find(".inline-edit").change(this._onInlineEdit.bind(this));
    html.find(".ability-name").click(this._onAbilityRoll.bind(this));
    html.find("a.regenerate").click(this._onRegenerate.bind(this));
  }

  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // e.g., data-type="cargo" attribute
    const type = header.dataset.type;
    const itemData = {
      name: `New ${type}`,
      type: type,
      data: {},
    };
    this.actor.createEmbeddedDocuments("Item", [itemData]);
  }

  _onItemEdit(event) {
    const row = $(event.currentTarget).parents(".item");
    if (row) {
      const item = this.actor.items.get(row.data("itemId"));
      if (item) {
        item.sheet.render(true);
      }
    }
  }

  _onItemDelete(event) {
    const row = $(event.currentTarget).parents(".item");
    this.actor.deleteEmbeddedDocuments("Item", [row.data("itemId")]);
    row.slideUp(200, () => this.render(false));
  }

  async _onInlineEdit(event) {
    event.preventDefault();
    const row = $(event.currentTarget).parents(".item");
    if (row) {
      const item = this.actor.items.get(row.data("itemId"));
      if (item) {
        const temp = event.currentTarget.dataset.mod;
        // currently only handling inline integers
        const value = parseInt(event.currentTarget.value);
        await item.update({ [temp]: value }, {});
      }
    }
  }

  _onAbilityRoll(event) {
    event.preventDefault();
    const ability = event.target.getAttribute("data-ability");
    this.actor.showAbilityCheckDialog(ability);
  }

  /**
   * +Add button for belongings tab
   */
  async _onAddBelonging(event) {
    event.preventDefault();
    this.actor.showAddItemDialog();
  }

  _onWeaponRoll(event) {
    event.preventDefault();
    const row = $(event.currentTarget).parents(".item");
    const itemId = row.data("itemId");
    this.actor.showAttackDialogWithItem(itemId);
  }

  _onDamageRoll(event) {
    event.preventDefault();
    const row = $(event.currentTarget).parents(".item");
    const itemId = row.data("itemId");
    this.actor.rollItemDamage(itemId);
  }

  async _onEquipToggle(event) {
    event.preventDefault();
    const anchor = $(event.currentTarget);
    const li = anchor.parents(".item");
    const itemId = li.data("itemId");
    const item = this.actor.items.get(itemId);
    if (item.equipped) {
      await item.unequip();
    } else {
      await item.equip();
    }
  }

  _onItemConditionCheck(event) {
    const row = $(event.currentTarget).parents(".item");
    if (row) {
      const item = this.actor.items.get(row.data("itemId"));
      if (item) {
        item.checkCondition();
      }
    }
  }

  _onRegenerate(event) {
    event.preventDefault();
    if (this.actor.data.type === "npc") {
      // don't confirm
      this.actor.regenerate();
    } else {
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
}
