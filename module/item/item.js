/**
 * @extends {Item}
 */
export class DISItem extends Item {
  get equipped() {
    return this.data.data.equipped === true;
  }  

  async equip() {
    await this.update({ "data.equipped": true });
  }

  async unequip() {
    await this.update({ "data.equipped": false });
  }
}