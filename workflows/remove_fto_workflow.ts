import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { RemoveFTO } from "../functions/remove_fto.ts";

// Step 0. Define the workflow!
const RemoveFTOWorkflow = DefineWorkflow({
  callback_id: "remove_fto_workflow",
  title: "Remove a FTO request",
  description: "Delete a request for FTO by id",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel: {
        type: Schema.slack.types.channel_id,
      },
    },
    required: ["interactivity"],
  },
});

// Step 1. Collect input using the built-in OpenForm function
const deleteParameters = RemoveFTOWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Remove FTO request",
    description: "Delete a request for FTO",
    interactivity: RemoveFTOWorkflow.inputs.interactivity,
    submit_label: "Remove",
    fields: {
      elements: [{
        name: "request_id",
        title: "Request ID",
        type: Schema.types.string,
      }],
      required: ["request_id"],
    },
  },
);

// Step 2. Delete a request from the datastore
RemoveFTOWorkflow.addStep(
  RemoveFTO,
  {
    request_id: deleteParameters.outputs.fields.request_id,
  },
);

// Step 3. Notify the deleter that the request was removed
RemoveFTOWorkflow.addStep(Schema.slack.functions.SendEphemeralMessage, {
  channel_id: RemoveFTOWorkflow.inputs.channel,
  user_id: RemoveFTOWorkflow.inputs.interactivity.interactor.id,
  message:
    `FTO request \`${deleteParameters.outputs.fields.request_id}\` has been deleted.`,
});

export default RemoveFTOWorkflow;
