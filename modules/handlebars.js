export function registerHandlebarsHelpers(){

    Handlebars.registerHelper("log", function (content) {
        console.log(content);
    });

    Handlebars.registerHelper("eq", function (a, b) {
        return a === b;
    });

    Handlebars.registerHelper("localizeCharacterType", function (type) {
        return game.i18n.localize(`AFMBE.CharacterTypes.${type}`);
    });

    Handlebars.registerHelper("isVehicle", function () {
        const bool = this.item.parent && this.item.parent.type == "vehicle"
        return bool;
    });
}
