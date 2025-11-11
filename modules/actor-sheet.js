export class afmbeActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["afmbe-jesuisfrog", "sheet", "actor", `${game.settings.get("afmbe-jesuisfrog", "dark-mode") ? "dark-mode" : ""}`],
            width: 700,
            height: 820,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "core" }],
            dragDrop: [{
                dragSelector: [
                    ".item"
                ],
                dropSelector: null
            }]
        });
    }

    /* -------------------------------------------- */
    /** @override */

    getData() {
        const data = super.getData();
        data.isGM = game.user.isGM;
        data.editable = data.options.editable;
        const actorData = data.system;
        let options = 0;
        let user = this.user;

        this._prepareCharacterItems(data)

        return data
    }

    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor

        // Initialize Containers
        const item = [];
        const equippedItem = [];
        const weapon = [];
        const power = [];
        const quality = [];
        const skill = [];
        const drawback = [];

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

                case "power":
                    power.push(i)
                    break

                case "quality":
                    quality.push(i)
                    break

                case "skill":
                    skill.push(i)
                    break

                case "drawback":
                    drawback.push(i)
                    break
            }
        }

        // Alphabetically sort all items
        const itemCats = [item, equippedItem, weapon, power, quality, skill, drawback]
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
        actorData.power = power
        actorData.quality = quality
        actorData.skill = skill
        actorData.drawback = drawback
    }

    get template() {
        const path = "systems/afmbe-jesuisfrog/templates";
        if (!game.user.isGM && this.actor.limited) return "systems/afmbe-jesuisfrog/templates/limited-character-sheet.hbs";
        return `${path}/${this.actor.type}-sheet.hbs`;
    }

    /** @override */
    async activateListeners(html) {
        super.activateListeners(html);

        // Run non-event functions
        this._createCharacterPointDivs()
        this._createStatusTags()

        // Buttons and Event Listeners
        html.find('.attribute-roll').click(this._onAttributeRoll.bind(this))
        if (this.actor.isOwner) html.find('.damage-roll').click(this._onDamageRoll.bind(this))
        html.find('.toggleEquipped').click(this._onToggleEquipped.bind(this))
        html.find('.armor-button-cell button').click(this._onArmorRoll.bind(this))
        html.find('.reset-resource').click(this._onResetResource.bind(this))

        // Update/Open Inventory Item
        html.find('.create-item').click(this._createItem.bind(this))

        html.find('.item-name').click((ev) => {
            const li = ev.currentTarget.closest(".item")
            const item = this.actor.items.get(li.dataset.itemId)
            if (item.isOwner) {
                item.sheet.render(true)
            }
            item.update({ "data.value": item.system.value })
        })

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = ev.currentTarget.closest(".item");
            this.actor.deleteEmbeddedDocuments("Item", [li.dataset.itemId]);
        });
    }

    /**
   * Handle clickable rolls.
   * @param event   The originating click event
   * @private
   */

    _createItem(event) {
        event.preventDefault()
        const element = event.currentTarget

        const typeKey = element.dataset.create
        const typeLabel = game.i18n.localize(`AFMBE.ItemType.${typeKey}`)
        let itemData = {
            name: game.i18n.format("AFMBE.Items.New", { type: typeLabel }),
            type: typeKey,
            cost: 0,
            level: 0
        }
        return Item.create(itemData, { parent: this.actor })
    }

    _createCharacterPointDivs() {
        let actorData = this.actor.system
        let attributesHeader = this.form.querySelector('#attributes-header')
        let qualityDiv = document.createElement('div')
        let drawbackDiv = document.createElement('div')
        let skillDiv = document.createElement('div')
        let powerDiv = document.createElement('div')
        let characterTypePath = actorData.characterTypes[actorData.characterType]

        // Construct and assign div elements to the headers
        if (characterTypePath != undefined && !this.actor.limited) {
            attributesHeader.innerHTML += ` - [${actorData.characterTypeValues[characterTypePath].attributePoints.value} / ${actorData.characterTypeValues[characterTypePath].attributePoints.max}]`

            qualityDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].qualityPoints.value} / ${actorData.characterTypeValues[characterTypePath].qualityPoints.max}]`
            this.form.querySelector('#quality-header').append(qualityDiv)

            drawbackDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].drawbackPoints.value} / ${actorData.characterTypeValues[characterTypePath].drawbackPoints.max}]`
            this.form.querySelector('#drawback-header').append(drawbackDiv)

            skillDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].skillPoints.value} / ${actorData.characterTypeValues[characterTypePath].skillPoints.max}]`
            this.form.querySelector('#skill-header').append(skillDiv)

            powerDiv.innerHTML = `- [${actorData.characterTypeValues[characterTypePath].metaphysicsPoints.value} / ${actorData.characterTypeValues[characterTypePath].metaphysicsPoints.max}]`
            this.form.querySelector('#power-header').append(powerDiv)
        }
    }


    _onAttributeRoll(event) {
        event.preventDefault()
        const element = event.currentTarget
        const attributeKey = element.dataset.attributeKey || element.dataset.attributeName?.toLowerCase()
        if (!attributeKey) { return }
        const attributeLabel = element.dataset.attributeLabel || attributeKey
        const actorData = this.actor.system

        const noneLabel = game.i18n.localize("AFMBE.Common.None")
        const penaltiesLabel = game.i18n.localize("AFMBE.Common.Penalties")
        const userModifierLabel = game.i18n.localize("AFMBE.Chat.UserModifier")
        const modifiersLabel = game.i18n.localize("AFMBE.Chat.Modifiers")
        const ruleOfTenLabel = game.i18n.localize("AFMBE.Chat.RuleOfTenTitle")
        const ruleOfOneLabel = game.i18n.localize("AFMBE.Chat.RuleOfOneTitle")
        const rollAgainLabel = game.i18n.localize("AFMBE.Chat.RollAgain")
        const dialogTitle = game.i18n.localize("AFMBE.Dialog.AttributeRoll.Title")
        const dialogHeader = game.i18n.format("AFMBE.Dialog.AttributeRoll.Header", { attribute: attributeLabel })
        const dialogInstructions = game.i18n.localize("AFMBE.Dialog.AttributeRoll.Help")
        const simpleDescription = game.i18n.localize("AFMBE.Dialog.AttributeRoll.SimpleDescription")
        const difficultDescription = game.i18n.localize("AFMBE.Dialog.AttributeRoll.DifficultDescription")
        const attributeTestLabel = game.i18n.localize("AFMBE.Dialog.AttributeRoll.AttributeTest")
        const rollModifierLabel = game.i18n.localize("AFMBE.Dialog.AttributeRoll.RollModifier")
        const skillsLabel = game.i18n.localize("AFMBE.Dialog.AttributeRoll.Skills")
        const qualitiesLabel = game.i18n.localize("AFMBE.Dialog.AttributeRoll.Qualities")
        const drawbacksLabel = game.i18n.localize("AFMBE.Dialog.AttributeRoll.Drawbacks")
        const cancelLabel = game.i18n.localize("AFMBE.Dialog.Button.Cancel")
        const rollLabel = game.i18n.localize("AFMBE.Dialog.Button.Roll")
        const attributeTestOptions = [
            { value: "simple", label: game.i18n.localize("AFMBE.AttributeTest.Simple") },
            { value: "difficult", label: game.i18n.localize("AFMBE.AttributeTest.Difficult") }
        ]
        const attributeTestNames = Object.fromEntries(attributeTestOptions.map(opt => [opt.value, opt.label]))

        const attributeValueBase = actorData.primaryAttributes[attributeKey]?.value ?? 0

        const buildOptions = (items, formatter) => items.map(entry => `
                                                <option value="${entry.id}">${formatter(entry)}</option>`).join("")
        const skillOptions = buildOptions(this.actor.items.filter(item => item.type === 'skill'), skill => `${skill.name} ${skill.system.level}`)
        const qualityOptions = buildOptions(this.actor.items.filter(item => item.type === 'quality'), quality => `${quality.name} ${quality.system.bonus}`)
        const drawbackOptions = buildOptions(this.actor.items.filter(item => item.type === 'drawback'), drawback => `${drawback.name} ${drawback.system.bonus}`)

        const penaltyTags = []
        if (actorData.secondaryAttributes.endurance_points.loss_toggle) {
            penaltyTags.push(`<span class="penaltyColorClass">${game.i18n.format("AFMBE.Penalties.EnduranceLoss", { value: actorData.secondaryAttributes.endurance_points.loss_penalty })}</span>`)
        }
        if (actorData.secondaryAttributes.essence.loss_toggle) {
            penaltyTags.push(`<span class="penaltyColorClass">${game.i18n.format("AFMBE.Penalties.EssenceLoss", { value: actorData.secondaryAttributes.essence.loss_penalty })}</span>`)
        }
        const penaltyHtml = penaltyTags.length ? penaltyTags.join(' | ') : noneLabel

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

                            <div class="afmbe-tags-flex-container">
                                <b>${penaltiesLabel}</b>: ${penaltyHtml}
                            </div>

                            <table>
                                <tbody>
                                    <tr>
                                        <td class="table-bold-text">${attributeTestLabel}</td>
                                        <td>
                                            <select id="attributeTestSelect" name="attributeTest">
                                                ${attributeTestOptions.map(option => `<option value="${option.value}">${option.label}</option>`).join("")}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">${rollModifierLabel}</td>
                                        <td><input class="attribute-input" type="number" value="0" name="inputModifier" id="inputModifier"></td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">${skillsLabel}</td>
                                        <td>
                                            <select id="skillSelect" name="skills">
                                                <option value="">${noneLabel}</option>${skillOptions}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">${qualitiesLabel}</td>
                                        <td>
                                            <select id="qualitySelect" name="qualities">
                                                <option value="">${noneLabel}</option>${qualityOptions}
                                            </select>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="table-bold-text">${drawbacksLabel}</td>
                                        <td>
                                            <select id="drawbackSelect" name="drawbacks">
                                                <option value="">${noneLabel}</option>${drawbackOptions}
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
                        const attributeTestSelect = html[0].querySelector('#attributeTestSelect').value
                        const userInputModifier = Number(html[0].querySelector('#inputModifier').value)
                        const selectedSkill = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#skillSelect').value)
                        const selectedQuality = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#qualitySelect').value)
                        const selectedDrawback = this.actor.getEmbeddedDocument("Item", html[0].querySelector('#drawbackSelect').value)

                        const attributeValue = attributeTestSelect === 'simple' ? attributeValueBase * 2 : attributeValueBase
                        const skillValue = selectedSkill ? selectedSkill.system.level : 0
                        const qualityValue = selectedQuality ? selectedQuality.system.bonus : 0
                        const drawbackValue = selectedDrawback ? selectedDrawback.system.bonus : 0

                        let tags = []
                        if (userInputModifier !== 0) { tags.push(`<span class="${userInputModifier >= 0 ? "bonusColorClass" : 'penaltyColorClass'}">${userModifierLabel} ${userInputModifier >= 0 ? "+" : ''}${userInputModifier}</span>`) }
                        if (selectedSkill) {
                            const skillLevel = selectedSkill.system.level;
                            tags.push(`<span class="${skillLevel >= 0 ? 'bonusColorClass' : 'penaltyColorClass'}">${selectedSkill.name} ${skillLevel >= 0 ? '+' : ''}${skillLevel}</span>`)
                        }
                        if (selectedQuality) {
                            const qualityBonus = selectedQuality.system.bonus;
                            tags.push(`<span class="${qualityBonus >= 0 ? 'bonusColorClass' : 'penaltyColorClass'}">${selectedQuality.name} ${qualityBonus >= 0 ? '+' : ''}${qualityBonus}</span>`)
                        }
                        if (selectedDrawback) {
                            const drawbackPenalty = selectedDrawback.system.bonus;
                            tags.push(`<span class="penaltyColorClass">${selectedDrawback.name} ${drawbackPenalty >= 0 ? '-' : ''}${drawbackPenalty}</span>`)
                        }

                        const rollMod = (attributeValue + skillValue + qualityValue - drawbackValue + userInputModifier)
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

                        const modifiersHtml = [...tags, ...penaltyTags].length ? [...tags, ...penaltyTags].join(' | ') : noneLabel
                        const attributeSummary = game.i18n.format("AFMBE.Chat.AttributeRollSummary", { attribute: attributeLabel, value: attributeValueBase, test: attributeTestNames[attributeTestSelect] || attributeTestSelect })
                        const chatContent = `<form>
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
                                                            <td class="table-center-align" data-roll="modifier" data-mod="${rollMod}">${rollMod}</td>
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
            default: 'two',
            close: html => console.log()
        }, dialogOptions)

        d.render(true)
    }



    async _onDamageRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
        let weapon = this.actor.getEmbeddedDocument("Item", element.closest('.item').dataset.itemId)

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
                        const shotNumber = Number(html[0].querySelector('#shotNumber').value) || 0
                        const firingMode = html[0].querySelector('#firingMode').value

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


    async _onArmorRoll(event) {
        event.preventDefault()
        let element = event.currentTarget
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

    _onToggleEquipped(event) {
        event.preventDefault()
        let element = event.currentTarget
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

    _onResetResource(event) {
        event.preventDefault()
        const actorData = this.actor.system
        const element = event.currentTarget
        const dataPath = `system.secondaryAttributes.${element.dataset.resource}.value`
        const resetResourceValue = actorData.secondaryAttributes[element.dataset.resource].max
        this.actor.update({ [dataPath]: resetResourceValue })
    }

    _createStatusTags() {
        let tagContainer = this.form.querySelector('.tags-flex-container')
        let encTag = document.createElement('div')
        let enduranceTag = document.createElement('div')
        let essenceTag = document.createElement('div')
        let injuryTag = document.createElement('div')
        let actorData = this.actor.system

        // Create Essence Tag and & Append
        if (actorData.secondaryAttributes.essence.value <= 1) {
            essenceTag.innerHTML = `<div>${game.i18n.localize("AFMBE.Status.Hopeless")}</div>`
            essenceTag.title = game.i18n.localize("AFMBE.Status.HopelessHint")
            essenceTag.classList.add('tag')
            tagContainer.append(essenceTag)
        }
        else if (actorData.secondaryAttributes.essence.value <= (actorData.secondaryAttributes.essence.max / 2)) {
            essenceTag.innerHTML = `<div>${game.i18n.localize("AFMBE.Status.Forlorn")}</div>`
            essenceTag.title = game.i18n.localize("AFMBE.Status.ForlornHint")
            essenceTag.classList.add('tag')
            tagContainer.append(essenceTag)
        }

        // Create Endurance Tag and & Append
        if (actorData.secondaryAttributes.endurance_points.value <= 5) {
            enduranceTag.innerHTML = `<div>${game.i18n.localize("AFMBE.Status.Exhausted")}</div>`
            enduranceTag.title = game.i18n.localize("AFMBE.Status.ExhaustedHint")
            enduranceTag.classList.add('tag')
            tagContainer.append(enduranceTag)
        }

        // Create Injury Tag and & Append
        if (actorData.secondaryAttributes.hp.value <= -10) {
            injuryTag.innerHTML = `<div>${game.i18n.localize("AFMBE.Status.Dying")}</div>`
            injuryTag.classList.add('tag')
            injuryTag.title = game.i18n.localize("AFMBE.Status.DyingHint")
            tagContainer.append(injuryTag)
        }
        else if (actorData.secondaryAttributes.hp.value <= 0) {
            injuryTag.innerHTML = `<div>${game.i18n.localize("AFMBE.Status.SemiConscious")}</div>`
            injuryTag.classList.add('tag')
            injuryTag.title = game.i18n.localize("AFMBE.Status.SemiConsciousHint")
            tagContainer.append(injuryTag)
        }
        else if (actorData.secondaryAttributes.hp.value <= 5) {
            injuryTag.innerHTML = `<div>${game.i18n.localize("AFMBE.Status.SeverelyInjured")}</div>`
            injuryTag.classList.add('tag')
            injuryTag.title = game.i18n.localize("AFMBE.Status.SeverelyInjuredHint")
            tagContainer.append(injuryTag)
        }

        // Create Encumbrance Tags & Append
        switch (actorData.encumbrance.level) {
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
