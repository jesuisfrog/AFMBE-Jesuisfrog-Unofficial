// Import Modules
import { afmbeActorSheet } from "./actor-sheet.js";
import { afmbeActor } from "./actor.js";
import { afmbeItemSheet } from "./item-sheet.js";
import { afmbeCreatureSheet } from "./creature-sheet.js"
import { afmbeVehicleSheet } from "./vehicle-sheet.js"

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", async function() {
    console.log(`Initializing AFMBE System`);

    /**
	 * Set an initiative formula for the system
	 * @type {String}
	 */
	CONFIG.Combat.initiative = {
        formula: "1d6",
        decimals: 0
      };

      // Define Custom Entity Classes
      CONFIG.Actor.documentClass = afmbeActor

      // Register sheet application classes
      Actors.unregisterSheet("core", ActorSheet)

      Actors.registerSheet("afmbe", afmbeActorSheet, 
      {
          types: ["character"],
          makeDefault: true,
          label: "Default AFMBE Character Sheet"
      })

      Actors.registerSheet("afmbe", afmbeCreatureSheet, 
      {
          types: ["creature"],
          makeDefault: true,
          label: "Default AFMBE Creature Sheet"
      })

      Actors.registerSheet("afmbe", afmbeVehicleSheet, 
      {
          types: ["vehicle"],
          makeDefault: true,
          label: "Default AFMBE Vehicle Sheet"
      })

      Items.registerSheet("afmbe", afmbeItemSheet, 
      {
          makeDefault: true,
          label: "Default AFMBE Item Sheet"
      })
})