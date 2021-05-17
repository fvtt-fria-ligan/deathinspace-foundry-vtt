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
    this.actor.createOwnedItem(itemData);
  }  

  _onItemEdit(event) {
    const li = $(event.currentTarget).parents(".item");
    const item = this.actor.getOwnedItem(li.data("itemId"));
    item.sheet.render(true);
  }

  _onItemDelete(event) {
    const li = $(event.currentTarget).parents(".item");
    const itemId = li.data("itemId");
    this.actor.deleteOwnedItem(li.data("itemId"));
    li.slideUp(200, () => this.render(false));
  }
}
