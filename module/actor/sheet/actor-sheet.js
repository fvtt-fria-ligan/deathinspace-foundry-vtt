/**
 * @extends {ActorSheet}
 */
export default class DISActorSheet extends ActorSheet {
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find('.item-create').click(this._onItemCreate.bind(this));
    html.find(".item-edit").click(this._onItemEdit.bind(this));
    html.find(".item-delete").click(this._onItemDelete.bind(this));
    html.find('.inline-edit').change(this._onInlineEdit.bind(this));
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

  _onInlineEdit(event) {
    event.preventDefault();
    const row = $(event.currentTarget).parents(".item");
    if (row) {
      const item = this.actor.items.get(row.data("itemId"));
      if (item) {
        const temp = event.currentTarget.dataset.mod;
        return item.update({ [temp]: event.currentTarget.value }, {});
      }
    }
  }
}
