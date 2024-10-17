export function registerHandlebarsHelpers(){

    Handlebars.registerHelper("log", function (content) {
        console.log(content);
    });
}