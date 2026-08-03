const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class afmbevehicleSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ["afmbe-jesuisfrog", "sheet", "actor", "themed"],
        position: { width: 700, height: 780 },
        dragDrop: [{ dragSelector: ".item", dropSelector: null }],
        tag: "form",
        window: { resizable: true },
        form: { submitOnChange: true, closeOnSubmit: false },
        actions: {
            damageRoll: afmbevehicleSheet.#onDamageRoll,
            toggleEquipped: afmbevehicleSheet.#onToggleEquipped,
            armorRoll: afmbevehicleSheet.#onArmorRoll,
            createItem: afmbevehicleSheet.#onCreateItem,
            viewItem: afmbevehicleSheet.#onViewItem,
            deleteItem: afmbevehicleSheet.#onDeleteItem
        }
    };

    /** @override */
    static TABS = {
        primary: {
            tabs: [
                { id: "core", group: "primary", label: "AFMBE.Sheet.Tab.Core" }
                ],
            initial: "core"
        }
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);
        const darkMode = game.settings.get("afmbe-jesuisfrog", "dark-mode");
        this.element.classList.toggle("dark-mode", darkMode);
        this.element.classList.toggle("theme-dark", darkMode);
        this.element.classList.toggle("theme-light", !darkMode);
    }

    /* -------------------------------------------- */
    /** @override */

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const actorData = this.actor.toObject(false);
        context.actor = actorData;
        context.system = actorData.system;
        context.items = actorData.items;
        context.owner = this.actor.isOwner;
        context.isGM = game.user.isGM;
        context.tabs = this._prepareTabs("primary");
        context.editable = this.isEditable;
        this._prepareCharacterItems(context);
        return context;
    }

    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor

        // Initialize Containers
        const item = [];
        const equippedItem = [];
        const weapon = [];

        // Iterate through items and assign to containers
        for (let i of sheetData.items) {
            switch (i.type) {
                case "item":
                    if (i.system.equipped) { equippedItem.push(i) }
                    else { item.push(i) }
                    break

                case "weapon":
                    weapon.push(i)
                    break
            }
        }

        // Alphabetically sort all items
        const itemCats = [item, equippedItem, weapon]
        for (let category of itemCats) {
            if (category.length > 1) {
                category.sort((a, b) => {
                    let nameA = a.name.toLowerCase()
                    let nameB = b.name.toLowerCase()
                    if (nameA > nameB) { return 1 }
                    else { return -1 }
                })
            }
        }

        // Assign and return items
        actorData.item = item
        actorData.equippedItem = equippedItem
        actorData.weapon = weapon
    }

    /** @override */
    static PARTS = {
        form: { template: "systems/afmbe-jesuisfrog/templates/vehicle-sheet.hbs" },
    };

    /** @override */
    _configureRenderParts(options) {
        const parts = super._configureRenderParts(options);
        if (!game.user.isGM && this.actor.limited) {
            parts.form = { template: "systems/afmbe-jesuisfrog/templates/limited-vehicle-sheet.hbs" };
        }
        return parts;
    }

    /* -------------------------------------------- */
    /*  Action Handlers                              */
    /* -------------------------------------------- */

    static #onCreateItem(event, target) {
        event.preventDefault();
        const typeKey = target.dataset.create;
        const typeLabel = game.i18n.localize(`AFMBE.ItemType.${typeKey}`);
        let itemData = {
            name: game.i18n.format("AFMBE.Items.New", { type: typeLabel }),
            type: typeKey,
            cost: 0,
            level: 0
        };
        return Item.create(itemData, { parent: this.actor });
    }

    static async #onDamageRoll(event, target) {
        event.preventDefault()
        let element = target
        let weapon = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

        let roll = await new Roll(weapon.system.damage).evaluate()

        // Create Chat Content
        let chatContent = `<div>
                                <h2>${game.i18n.format("AFMBE.Chat.DamageRollFor", { weapon: weapon.name })}</h2>

                                <table class="afmbe-chat-roll-table">
                                    <thead>
                                        <tr>
                                            <th class="table-center-align">${game.i18n.localize("AFMBE.Chat.Damage")}</th>
                                            <th class="table-center-align">${game.i18n.localize("AFMBE.Chat.Type")}</th>
                                            <th class="table-center-align">${game.i18n.localize("AFMBE.Chat.Detail")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td class="table-center-align">[[${roll.result}]]</td>
                                            <td class="table-center-align">${weapon.system.damage_types[weapon.system.damage_type]}</td>
                                            <td class="table-center-align">${weapon.system.damage}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>`

        ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            content: chatContent,
            rolls: [roll]
        })
    }

    static async #onArmorRoll(event, target) {
        event.preventDefault()
        let element = target
        let equippedItem = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

        let roll = await new Roll(equippedItem.system.armor_value).evaluate()

        // Create Chat Content
        let chatContent = `<div>
                                <h2>${game.i18n.format("AFMBE.Chat.ArmorRollFor", { armor: equippedItem.name })}</h2>

                                <table class="afmbe-chat-roll-table">
                                    <thead>
                                        <tr>
                                            <th class="table-center-align">${game.i18n.localize("AFMBE.Chat.Result")}</th>
                                            <th class="table-center-align">${game.i18n.localize("AFMBE.Chat.Detail")}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td class="table-center-align">[[${roll.result}]]</td>
                                            <td class="table-center-align">${equippedItem.system.armor_value}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>`

        ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker(),
            content: chatContent,
            rolls: [roll]
        })
    }

    static #onToggleEquipped(event, target) {
        event.preventDefault()
        let element = target
        let equippedItem = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

        switch (equippedItem.system.equipped) {
            case true:
                equippedItem.update({ 'system.equipped': false })
                break

            case false:
                equippedItem.update({ 'system.equipped': true })
                break
        }
    }

    static #onViewItem(event, target) {
        const li = target.closest(".item");
        const item = this.actor.items.get(li.dataset.itemId);
        item.sheet.render(true);
        item.update({ "system.value": item.system.value });
    }

    static #onDeleteItem(event, target) {
        const li = target.closest(".item");
        this.actor.deleteEmbeddedDocuments("Item", [li.dataset.itemId]);
    }

}
