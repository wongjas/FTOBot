import { Manifest } from "deno-slack-sdk/mod.ts";
import { FTORequestsDatastore } from "./datastores/fto_requests.ts";
import CreateFTOWorkflow from "./workflows/request_fto_workflow.ts";
import LookupFTOWorkflow from "./workflows/lookup_fto_workflow.ts";

// Manage app settings
export default Manifest({
  name: "FTO Litmus",
  description: "Request and manage flexible time off",
  icon: "assets/default_new_app_icon.png",
  workflows: [CreateFTOWorkflow, LookupFTOWorkflow],
  datastores: [FTORequestsDatastore],
  outgoingDomains: [],
  botScopes: [
    "commands",
    "chat:write",
    "chat:write.public",
    "datastore:read",
    "datastore:write",
  ],
});
