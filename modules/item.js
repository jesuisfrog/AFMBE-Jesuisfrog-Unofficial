export class afmbeItem extends Item {

    async prepareData() {
        super.prepareData()

        // Get the Item's data & Actor's data
        const itemData = this.data.data
        const actorData = this.actor ? this.actor.data : {}

        // Prepare Data based on item type
        switch (this.type) {
            case 'quality':
            case 'drawback':
            case 'aspect':
                this._prepareQualityDrawback(actorData, itemData)
                break

            case 'skill':
            case 'power':
                this._prepareSkillPower(actorData, itemData)
                break

            case 'weapon':
            case 'item':
                this._prepareWeaponItem(actorData, itemData)
                break
        }
    }

    _prepareQualityDrawback(actorData, itemData) {
        
    }
}