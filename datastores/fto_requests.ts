import { DefineDatastore, Schema } from "deno-slack-sdk/mod.ts";

export const FTORequestsDatastore = DefineDatastore({
  name: "fto_requests",
  primary_key: "request_id",
  attributes: {
    request_id: {
      type: Schema.types.string,
    },
    employee: {
      type: Schema.slack.types.user_id,
    },
    manager: {
      type: Schema.slack.types.user_id,
    },
    start_date: {
      type: Schema.slack.types.date,
    },
    end_date: {
      type: Schema.slack.types.date,
    },
    reason: {
      type: Schema.types.string,
    },
  },
});
