export class afmbeItem extends Item {

    async prepareData() {
        super.prepareData()

        // Get the Item's data & Actor's data
        const itemData = this.data.data
        const actorData = this.actor ? this.actor.data : {}

        // Prepare Data based on item type
        if (itemData && actorData) {
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
                    this._prepareWeaponItem(actorData, itemData)
                    break
            }
        }
    }

    _prepareQualityDrawback(actorData, itemData) {}

    _prepareSkillPower(actorData, itemData) {}

    _prepareWeaponItem(actorData, itemData) {
        // Build Damage String by combining Damage Entry with Damage Multiplier Entry (Looks at Actor to grab Multiplier Value)
        if (itemData.damage_cha_multiplier != "none" && this.isEmbedded) {
            itemData.damage_string = `${itemData.damage}*${actorData.data[itemData.damage_cha_multiplier].value}`
        }
        else if (itemData.damage_cha_multiplier === 'none') {
            itemData.damage_string = itemData.damage
        }
    }
}