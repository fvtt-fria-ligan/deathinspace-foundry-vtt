/**
 * @extends {ActorSheet}
 */
export default class DISActorSheet extends ActorSheet {
  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find(".item-delete").click((ev) => {
      console.log("************");
      const li = $(ev.currentTarget).parents(".item");
      console.log(li);
      const itemId = li.data("itemId");
      console.log(`got ${itemId}`);
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });
  }
}
