import { Trigger } from "deno-slack-api/types.ts";
import RemoveFTO from "../workflows/remove_fto_workflow.ts";

// Define the link trigger for the request workflow
const removeFTOTrigger: Trigger<typeof RemoveFTO.definition> = {
  type: "shortcut",
  name: "Delete a FTO request",
  description: "Delete a request for FTO",
  workflow: "#/workflows/remove_fto_workflow",
  inputs: {
    interactivity: {
      value: "{{data.interactivity}}",
    },
    channel: {
      value: "{{data.channel_id}}",
    },
  },
};

export default removeFTOTrigger;
