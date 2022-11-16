import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { LookupFTO } from "../functions/lookup_fto.ts";

// Step 0. Define the workflow!
const LookupFTOWorkflow = DefineWorkflow({
  callback_id: "lookup_fto_workflow",
  title: "Lookup employee FTO requests",
  description: "Lookup the requests made by an employee",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
    },
    required: ["interactivity"],
  },
});

// Step 1. Collect input using the built-in OpenForm function
const searchParameters = LookupFTOWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Lookup FTO requests",
    description: "Find previously created FTO requests",
    interactivity: LookupFTOWorkflow.inputs.interactivity,
    submit_label: "Search",
    fields: {
      elements: [{
        name: "employee",
        title: "Employee",
        type: Schema.slack.types.user_id,
      }],
      required: ["employee"],
    },
  },
);

// Step 2. Find requests for an employee and post to channel
LookupFTOWorkflow.addStep(
  LookupFTO,
  {
    interactivity: searchParameters.outputs.interactivity,
    employee: searchParameters.outputs.fields.employee,
  },
);

export default LookupFTOWorkflow;
