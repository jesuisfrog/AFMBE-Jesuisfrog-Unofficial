const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
export class afmbeItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

    /** @override */

    static DEFAULT_OPTIONS = {
        tag: "form",
        classes: ["afmbe-jesuisfrog", "sheet", "item"],
        position: { width: 600, height: 450 },
        window: { resizable: true },
        form: { submitOnChange: true, closeOnSubmit: false }
    };

    /** @override */
    _onRender(context, options) {
        super._onRender(context, options);
        this.element.classList.toggle("dark-mode", game.settings.get("afmbe-jesuisfrog", "dark-mode"));
    }

    // static get defaultOptions() {
    //     return foundry.utils.mergeObject(super.defaultOptions, {
    //         classes: ["afmbe-jesuisfrog", "sheet", "item", `${game.settings.get("afmbe-jesuisfrog", "dark-mode") ? "dark-mode" : ""}`],
    //         width: 600,
    //         height: 450,
    //         tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body-items", initial: "description" }]
    //     })
    // }

    /* -------------------------------------------- */


    /** @override */
    static PARTS = {
        form: { template: "systems/afmbe-jesuisfrog/templates/item-sheet.hbs" }
    };

    /** @override */
    _configureRenderParts(options) {
        const parts = super._configureRenderParts(options);
        parts.form = { template: `systems/afmbe-jesuisfrog/templates/${this.item.type}-sheet.hbs` };
        return parts;
    }

    // get template() {
    //     const path = "systems/afmbe-jesuisfrog/templates";
    //     return `${path}/${this.item.type}-sheet.hbs`;
    // }

    /** @override */
    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.dtypes = ["String", "Number", "Boolean"];
        context.isGM = game.user.isGM;
        context.editable = this.isEditable;
        context.data = context.system;
        return context;
    }

    // getData() {
    //     const data = super.getData();
    //     data.dtypes = ["String", "Number", "Boolean"];
    //     data.isGM = game.user.isGM;
    //     data.editable = data.options.editable;
    //     const itemData = data.system;
    //     data.data = itemData;
    //     return data;
    // }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.querySelector(".sheet-body");
        if(sheetBody) {
            sheetBody.style.height = `${position.height - 192}px`;
        }
        return position;
    }

    /**
   * Handle clickables
   * @param {Event} event   The originating click event
   * @private
   */



}
