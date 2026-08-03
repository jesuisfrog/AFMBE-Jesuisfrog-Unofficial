const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class afmbeCreatureSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ["afmbe-jesuisfrog", "sheet", "actor"],
        position: { width: 700, height: 820 },
        dragDrop: [{ dragSelector: ".item", dropSelector: null }],
        tag: "form",
        window: { rezisable: true },
        form: { submitOnChange: true, closeOnSubmit: false },
        actions: {
            attributeRoll: afmbeCreatureSheet.#onAttributeRoll,
            damageRoll: afmbeCreatureSheet.#onDamageRoll,
            toggleEquipped: afmbeCreatureSheet.#onToggleEquipped,
            armorRoll: afmbeCreatureSheet.#onArmorRoll,
            resetResource: afmbeCreatureSheet.#onResetResource,
            createItem: afmbeCreatureSheet.#onCreateItem,
            viewItem: afmbeCreatureSheet.#onViewItem,
            deleteItem: afmbeCreatureSheet.#onDeleteItem
        }
    };

    /** @override */
    static TABS = {
        primary: {
            tabs: [
                { id: "core", group: primary, label: "AFMBE.Sheet.Tab.Core" },
                { id: "equipment", group: primary, label: "AFMBE.Sheet.Tab.Equipment" },
            ],
            initial: "core"
        }
    }

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);
        this.element.classList.toggle("dark-mode", game.settings.get("afmbe-jesuisfrog", "dark-mode"));
        this._createStatusTags();
    }
    // static get defaultOptions() {
    //     return foundry.utils.mergeObject(super.defaultOptions, {
    //         classes: ["afmbe-jesuisfrog", "sheet", "actor", `${game.settings.get("afmbe-jesuisfrog", "dark-mode") ? "dark-mode" : ""}`],
    //         width: 700,
    //         height: 820,
    //         tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "core" }],
    //         dragDrop: [{
    //             dragSelector: [
    //                 ".item"
    //             ],
    //             dropSelector: null
    //         }]
    //     });
    // }

    /* -------------------------------------------- */
    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.isGM = game.user.isGM;
        context.tabs = this._prepareTabs("primary");
        context.editable = this.isEditable;
        this._prepareCharacterItems(context);
        return context;
    }

    // getData() {
    //     const data = super.getData();
    //     data.isGM = game.user.isGM;
    //     data.editable = data.options.editable;
    //     const actorData = data.system;
    //     let options = 0;
    //     let user = this.user;

    //     this._prepareCharacterItems(data)

    //     return data
    // }

    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor

        // Initialize Containers
        const item = [];
        const equippedItem = [];
        const weapon = [];
        const skill = [];
        const aspect = [];

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

                case "skill":
                    skill.push(i)
                    break

                case "aspect":
                    aspect.push(i)
                    break
            }
        }

        // Alphabetically sort all items
        const itemCats = [item, equippedItem, weapon, skill, aspect]
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
        actorData.skill = skill
        actorData.aspect = aspect
    }

    /** @override */
    static PARTS = {
        form: { template: "systems/afmbe-jesuisfrog/templates/creature-sheet.hbs" },
    };

    /** @override */
    _configureRenderParts(options) {
        const parts = super._configureRenderParts(options);
        if (!game.user.isGM && this.actor.limited) {
            parts.form = { template: "systems/afmbe-jesuisfrog/templates/limited-creature-sheet.hbs" };
        }
        return parts;
    }

    // get template() {
    //     const path = "systems/afmbe-jesuisfrog/templates";
    //     if (!game.user.isGM && this.actor.limited) return "systems/afmbe-jesuisfrog/templates/limited-creature-sheet.hbs";
    //     return `${path}/${this.actor.type}-sheet.hbs`;
    // }

    /** @override */
    // async activateListeners(html) {
    //     super.activateListeners(html);

    //     // Run non-event functions
    //     // this._createCharacterPointDivs()
    //     this._createStatusTags()

    //     // Buttons and Event Listeners
    //     html.find('.attribute-roll').click(this._onAttributeRoll.bind(this))
    //     if (this.actor.isOwner) html.find('.damage-roll').click(this._onDamageRoll.bind(this))
    //     html.find('.toggleEquipped').click(this._onToggleEquipped.bind(this))
    //     html.find('.armor-button-cell button').click(this._onArmorRoll.bind(this))
    //     html.find('.reset-resource').click(this._onResetResource.bind(this))

    //     // Update/Open Inventory Item
    //     html.find('.create-item').click(this._createItem.bind(this))

    //     html.find('.item-name').click((ev) => {
    //         const li = ev.currentTarget.closest(".item")
    //         const item = this.actor.items.get(li.dataset.itemId)
    //         if (this.actor.permission[game.user._id] >= 2 || game.user.isGM) { item.sheet.render(true) }
    //         item.update({ "system.value": item.system.value })
    //     })

    //     // Delete Inventory Item
    //     html.find('.item-delete').click(ev => {
    //         const li = ev.currentTarget.closest(".item");
    //         this.actor.deleteEmbeddedDocuments("Item", [li.dataset.itemId]);
    //     });
    // }

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


    static #onAttributeRoll(event, target) {
        event.preventDefault()
        const attributeKey = target.dataset.attributeKey || target.dataset.attributeName?.toLowerCase()
        if (!attributeKey) { return }
        const attributeLabel = target.dataset.attributeLabel || attributeKey

        const dialogTitle = game.i18n.localize("AFMBE.Dialog.AttributeRoll.Title")
        const dialogHeader = game.i18n.format("AFMBE.Dialog.AttributeRoll.Header", { attribute: attributeLabel })
        const dialogInstructions = game.i18n.localize("AFMBE.Dialog.CreatureAttributeRoll.Help")
        const simpleDescription = game.i18n.localize("AFMBE.Dialog.AttributeRoll.SimpleDescription")
        const difficultDescription = game.i18n.localize("AFMBE.Dialog.AttributeRoll.DifficultDescription")
        const attributeTestLabel = game.i18n.localize("AFMBE.Dialog.AttributeRoll.AttributeTest")
        const rollModifierLabel = game.i18n.localize("AFMBE.Dialog.AttributeRoll.RollModifier")
        const skillsLabel = game.i18n.localize("AFMBE.Dialog.AttributeRoll.Skills")
        const cancelLabel = game.i18n.localize("AFMBE.Dialog.Button.Cancel")
        const rollLabel = game.i18n.localize("AFMBE.Dialog.Button.Roll")
        const modifiersLabel = game.i18n.localize("AFMBE.Chat.Modifiers")
        const userModifierLabel = game.i18n.localize("AFMBE.Chat.UserModifier")
        const noneLabel = game.i18n.localize("AFMBE.Common.None")
        const ruleOfTenLabel = game.i18n.localize("AFMBE.Chat.RuleOfTenTitle")
        const ruleOfOneLabel = game.i18n.localize("AFMBE.Chat.RuleOfOneTitle")
        const rollAgainLabel = game.i18n.localize("AFMBE.Chat.RollAgain")
        const attributeTestOptions = [
            { value: "simple", label: game.i18n.localize("AFMBE.AttributeTest.Simple") },
            { value: "difficult", label: game.i18n.localize("AFMBE.AttributeTest.Difficult") }
        ]
        const attributeTestNames = Object.fromEntries(attributeTestOptions.map(opt => [opt.value, opt.label]))
        const attributeValueBase = this.actor.system.primaryAttributes[attributeKey]?.value ?? 0

        const skillOptions = this.actor.items
            .filter(item => item.type === 'skill')
            .map(skill => `
                                                <option value="${skill.id}">${skill.name} ${skill.system.level}</option>`)
            .join("")

        let mode = game.settings.get("afmbe-jesuisfrog", "dark-mode") ? "dark-mode" : ""
        let dialogOptions = { classes: ["dialog", "afmbe-jesuisfrog", mode] }

        const content = `<div class="afmbe-dialog-menu">
                            <h2>${dialogHeader}</h2>

                            <div class="afmbe-dialog-menu-text-box">
                                <div>
                                    <p>${dialogInstructions}</p>
                                    <ul>
                                        <li>${simpleDescription}</li>
                                        <li>${difficultDescription}</li>
                                    </ul>
                                </div>
                            </div>

                            <table>
                                <tbody>
                                    <tr>
                                        <td class="table-bold-text">${attributeTestLabel}</td>
                                        <td class="table-center-align">
                                            <select id="attributeTestSelect" name="attributeTest">
                                                ${attributeTestOptions.map(option => `<option value="${option.value}">${option.label}</option>`).join("")}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">${rollModifierLabel}</td>
                                        <td class="table-center-align"><input class="attribute-input" type="number" value="0" name="inputModifier" id="inputModifier"></td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">${skillsLabel}</td>
                                        <td class="table-center-align">
                                            <select id="skillSelect" name="skills">
                                                <option value="">${noneLabel}</option>${skillOptions}
                                            </select>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                    </div>`

        let d = new Dialog({
            title: dialogTitle,
            content,
            buttons: {
                one: {
                    label: cancelLabel,
                    callback: html => console.log('Cancelled')
                },
                two: {
                    label: rollLabel,
                    callback: async html => {
                        const attributeTestSelect = html.querySelector('#attributeTestSelect').value
                        const userInputModifier = Number(html.querySelector('#inputModifier').value)
                        const selectedSkill = this.actor.getEmbeddedDocument("Item", html.querySelector('#skillSelect').value)

                        const attributeValue = attributeTestSelect === 'simple' ? attributeValueBase * 2 : attributeValueBase
                        const skillValue = selectedSkill ? selectedSkill.system.level : 0

                        let tags = []
                        if (userInputModifier !== 0) { tags.push(`<span class="${userInputModifier >= 0 ? "bonusColorClass" : 'penaltyColorClass'}">${userModifierLabel} ${userInputModifier >= 0 ? "+" : ''}${userInputModifier}</span>`) }
                        if (selectedSkill) {
                            const skillLevel = selectedSkill.system.level;
                            tags.push(`<span class="${skillLevel >= 0 ? 'bonusColorClass' : 'penaltyColorClass'}">${selectedSkill.name} ${skillLevel >= 0 ? '+' : ''}${skillLevel}</span>`)
                        }

                        const rollMod = (attributeValue + skillValue + userInputModifier)
                        let roll = await new Roll('1d10').evaluate()
                        let totalResult = Number(roll.result) + rollMod

                        let ruleOfDiv = ``
                        if (roll.result == 10) {
                            ruleOfDiv = `<h2 class="rule-of-chat-text">${ruleOfTenLabel}</h2>
                                        <button type="button" data-roll="roll-again" class="rule-of-ten">${rollAgainLabel}</button>`
                        }
                        if (roll.result == 1) {
                            ruleOfDiv = `<h2 class="rule-of-chat-text">${ruleOfOneLabel}</h2>
                                        <button type="button" data-roll="roll-again" class="rule-of-one">${rollAgainLabel}</button>`
                        }

                        const modifiersHtml = tags.length ? tags.join(' | ') : noneLabel
                        const attributeSummary = game.i18n.format("AFMBE.Chat.AttributeRollSummary", { attribute: attributeLabel, value: attributeValueBase, test: attributeTestNames[attributeTestSelect] || attributeTestSelect })

                        let chatContent = `<form>
                                                <h2>${attributeSummary}</h2>
                                                <div class="afmbe-tags-flex-container"><b>${modifiersLabel}</b>: ${modifiersHtml}</div>
                                                <table class="afmbe-chat-roll-table">
                                                    <thead>
                                                        <tr>
                                                            <th class="table-center-align">${game.i18n.localize("AFMBE.Chat.Roll")}</th>
                                                            <th class="table-center-align">${game.i18n.localize("AFMBE.Chat.Modifier")}</th>
                                                            <th class="table-center-align">${game.i18n.localize("AFMBE.Chat.Result")}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td class="table-center-align" data-roll="dice-result">[[${roll.result}]]</td>
                                                            <td class="table-center-align" data-roll="modifier">${rollMod}</td>
                                                            <td class="table-center-align" data-roll="dice-total" data-roll-value="${totalResult}">${totalResult}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>

                                                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%;">
                                                    ${ruleOfDiv}
                                                </div>
                                            </form>`

                        ChatMessage.create({
                            user: game.user.id,
                            speaker: ChatMessage.getSpeaker(),
                            content: chatContent,
                            rolls: [roll]
                        })
                    }
                }
            },
            default: "two",
            close: html => console.log()
        }, dialogOptions)

        d.render(true)
    }



    static async #onDamageRoll(event, target) {
        event.preventDefault()
        let weapon = this.actor.getEmbeddedDocument("Item", target.closest('.item').dataset.itemId)

        const dialogTitle = game.i18n.localize("AFMBE.Dialog.WeaponRoll.Title")
        const rangedInfo = game.i18n.localize("AFMBE.Dialog.WeaponRoll.RangedInfo")
        const meleeInfo = game.i18n.localize("AFMBE.Dialog.WeaponRoll.MeleeInfo")
        const optionsLabel = game.i18n.localize("AFMBE.Dialog.WeaponRoll.Options")
        const shotsLabel = game.i18n.localize("AFMBE.Dialog.WeaponRoll.Shots")
        const firingModeLabel = game.i18n.localize("AFMBE.Dialog.WeaponRoll.FiringMode")
        const cancelLabel = game.i18n.localize("AFMBE.Dialog.Button.Cancel")
        const rollLabel = game.i18n.localize("AFMBE.Dialog.Button.Roll")
        const firingModes = [
            { value: "none", label: game.i18n.localize("AFMBE.Weapon.FiringMode.None") },
            { value: "semi", label: game.i18n.localize("AFMBE.Weapon.FiringMode.Semi") },
            { value: "burst", label: game.i18n.localize("AFMBE.Weapon.FiringMode.Burst") },
            { value: "auto", label: game.i18n.localize("AFMBE.Weapon.FiringMode.Auto") }
        ]
        const firingModeLabels = Object.fromEntries(firingModes.map(mode => [mode.value, mode.label]))
        const shotLabel = (count) => count === 1 ? game.i18n.format("AFMBE.Weapon.Shot.Single", { count }) : game.i18n.format("AFMBE.Weapon.Shot.Multiple", { count })

        let mode = game.settings.get("afmbe-jesuisfrog", "dark-mode") ? "dark-mode" : ""
        let dialogOptions = { classes: ["dialog", "afmbe-jesuisfrog", mode] }

        const content = `<div class="afmbe-dialog-menu">

                            <div class="afmbe-dialog-menu-text-box">
                                <p>${rangedInfo}</p>
                                <p>${meleeInfo}</p>
                            </div>

                            <div>
                                <h2>${optionsLabel}</h2>
                                <table>
                                    <tbody>
                                        <tr>
                                            <th>${shotsLabel}</th>
                                            <td>
                                                <input type="number" id="shotNumber" name="shotNumber" value="0">
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>${firingModeLabel}</th>
                                            <td>
                                                <select id="firingMode" name="firingMode">
                                                    ${firingModes.map(option => `<option value="${option.value}">${option.label}</option>`).join("")}
                                                </select>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                    <div>`

        let d = new Dialog({
            title: dialogTitle,
            content,
            buttons: {
                one: {
                    label: cancelLabel,
                    callback: html => console.log('Cancelled')
                },
                two: {
                    label: rollLabel,
                    callback: async html => {
                        const shotNumber = Number(html.querySelector('#shotNumber').value) || 0
                        const firingMode = html.querySelector('#firingMode').value

                        const roll = await new Roll(weapon.system.damage_string).evaluate()

                        let tags = []
                        if (firingMode !== 'none' && shotNumber > 0) {
                            tags.push(`<div><b>${firingModeLabels[firingMode]}</b>: ${shotLabel(shotNumber)}</div>`)
                        }

                        if (shotNumber > 0) {
                            switch (weapon.system.capacity.value - shotNumber >= 0) {
                                case true:
                                    weapon.update({ 'system.capacity.value': weapon.system.capacity.value - shotNumber })
                                    break

                                case false:
                                    return ui.notifications.info(game.i18n.format("AFMBE.Notifications.NotEnoughAmmo", { shots: shotNumber }))
                            }
                        }

                        const damageRollHeader = game.i18n.format("AFMBE.Chat.DamageRollFor", { weapon: weapon.name })
                        const damageLabel = game.i18n.localize("AFMBE.Chat.Damage")
                        const typeLabel = game.i18n.localize("AFMBE.Chat.Type")
                        const detailLabel = game.i18n.localize("AFMBE.Chat.Detail")

                        let chatContent = `<div>
                                                <h2>${damageRollHeader}</h2>

                                                <table class="afmbe-chat-roll-table">
                                                    <thead>
                                                        <tr>
                                                            <th class="table-center-align">${damageLabel}</th>
                                                            <th class="table-center-align">${typeLabel}</th>
                                                            <th class="table-center-align">${detailLabel}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td class="table-center-align">[[${roll.result}]]</td>
                                                            <td class="table-center-align">${weapon.system.damage_types[weapon.system.damage_type]}</td>
                                                            <td class="table-center-align">${weapon.system.damage_string}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>`

                        ChatMessage.create({
                            user: game.user.id,
                            speaker: ChatMessage.getSpeaker(),
                            flavor: `<div class="afmbe-tags-flex-container-item">${tags.join('')}</div>`,
                            content: chatContent,
                            rolls: [roll]
                        })
                    }
                }
            },
            default: "two",
            close: html => console.log()
        }, dialogOptions)

        d.render(true)
    }


    static async #onArmorRoll(event, target) {
        event.preventDefault()
        let equippedItem = this.actor.getEmbeddedDocument("Item", target.closest('.item').dataset.itemId)

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
        let equippedItem = this.actor.getEmbeddedDocument("Item", target.closest('.item').dataset.itemId)

        switch (equippedItem.system.equipped) {
            case true:
                equippedItem.update({ 'system.equipped': false })
                break

            case false:
                equippedItem.update({ 'system.equipped': true })
                break
        }
    }

    static #onResetResource(event, target) {
        event.preventDefault()
        const dataPath = `system.secondaryAttributes.${target.dataset.resource}.value`

        this.actor.update({ [dataPath]: this.actor.system.secondaryAttributes[target.dataset.resource].max })
    }

    static #onViewItem(event, target) {
        const li = target.closest(".item");
        const item = this.actor.items.get(li.dataset.itemId);
        if (this.actor.permission[game.user._id] >= 2 || game.user.isGM) { item.sheet.render(true); }
        item.update({ "system.value": item.system.value });
    }

    static #onDeleteItem(event, target) {
        const li = target.closest(".item");
        this.actor.deleteEmbeddedDocuments("Item", [li.dataset.itemId]);
    }

    _createStatusTags() {
        let tagContainer = this.element.querySelector('.tags-flex-container')
        let encTag = document.createElement('div')

        // Create Encumbrance Tags & Append
        switch (this.actor.system.encumbrance.level) {
            case 1:
                encTag.innerHTML = `<div>${game.i18n.localize("AFMBE.Status.Encumbrance.Light")}</div>`
                encTag.classList.add('tag')
                tagContainer.append(encTag)
                break

            case 2:
                encTag.innerHTML = `<div>${game.i18n.localize("AFMBE.Status.Encumbrance.Moderate")}</div>`
                encTag.classList.add('tag')
                tagContainer.append(encTag)
                break

            case 3:
                encTag.innerHTML = `<div>${game.i18n.localize("AFMBE.Status.Encumbrance.Heavy")}</div>`
                encTag.classList.add('tag')
                tagContainer.append(encTag)
                break
        }
    }

}
