import { Trigger } from "deno-slack-api/types.ts";
import LookupFTO from "../workflows/lookup_fto_workflow.ts";

// Define the link trigger for the lookup workflow
const lookupFTOTrigger: Trigger<typeof LookupFTO.definition> = {
  type: "shortcut",
  name: "Lookup employee time off",
  description: "Find past FTO requests made by a specific person",
  workflow: "#/workflows/lookup_fto_workflow",
  inputs: {
    interactivity: {
      value: "{{data.interactivity}}",
    },
  },
};

export default lookupFTOTrigger;
