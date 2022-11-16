import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { FTORequestsDatastore } from "../datastores/fto_requests.ts";

// Define the inputs needed for a time off request
export const RequestFTO = DefineFunction({
  callback_id: "request_fto",
  title: "Request FTO",
  description: "Send a request for flexible time off to a manager",
  source_file: "functions/request_fto.ts",
  input_parameters: {
    properties: {
      manager: {
        type: Schema.slack.types.user_id,
        description: "The approving manager",
      },
      employee: {
        type: Schema.slack.types.user_id,
        description: "The requesting employee",
      },
      start_date: {
        type: Schema.slack.types.date,
        description: "The requested start date",
      },
      end_date: {
        type: Schema.slack.types.date,
        description: "The requested end date",
      },
      reason: {
        type: Schema.types.string,
        description: "Reason for requesting time off",
      },
    },
    required: ["manager", "employee", "start_date", "end_date"],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

// Notify the manager of a request and store the request
export default SlackFunction(
  RequestFTO,
  async ({ inputs, client }) => {
    const { manager, employee, start_date, end_date, reason } = inputs;
    const request_id = crypto.randomUUID();

    const message = await client.chat.postMessage({
      channel: manager,
      text: "A new time-off request has been submitted",
      blocks: [{
        type: "header",
        text: {
          type: "plain_text",
          text: `A new time-off request has been submitted`,
        },
      }, {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*From:* <@${employee}>`,
        },
      }, {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Dates:* ${start_date} to ${end_date}`,
        },
      }, {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Reason:* ${reason ?? "_none provided_"}`,
        },
      }, {
        "type": "actions",
        "block_id": "approve-deny-buttons",
        "elements": [{
          type: "button",
          text: {
            type: "plain_text",
            text: "Approve",
          },
          action_id: "approve_request",
          style: "primary",
        }, {
          type: "button",
          text: {
            type: "plain_text",
            text: "Deny",
          },
          action_id: "deny_request",
          style: "danger",
        }],
      }],
      metadata: {
        event_type: "pto_request_created",
        event_payload: { request_id },
      },
    });

    if (!message.ok) {
      return { error: `Failed to send message: ${message.error}` };
    }

    const putResponse = await client.apps.datastore.put({
      datastore: "fto_requests",
      item: {
        request_id,
        employee,
        manager,
        start_date,
        end_date,
        reason,
      },
    });

    if (!putResponse.ok) {
      return { error: `Failed to store request: ${putResponse.error}` };
    }

    return { completed: false };
  },
).addBlockActionsHandler(
  ["approve_request", "deny_request"],
  async ({ action, body, client }) => {
    const metadata = body.message?.metadata;
    const { manager, employee, start_date, end_date, reason } =
      body.function_data.inputs;

    const putResponse = await client.apps.datastore.put<
      typeof FTORequestsDatastore.definition
    >({
      datastore: "fto_requests",
      item: {
        request_id: metadata?.event_payload?.request_id,
        manager,
        employee,
        start_date,
        end_date,
        reason,
        approved: action.action_id === "approve_request",
      },
    });

    if (!putResponse.ok) {
      return { error: `Failed to update request: ${putResponse.error}` };
    }

    const message = await client.chat.update({
      channel: body.channel?.id,
      ts: body.message?.ts,
      blocks: [{
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*FTO request from <@${employee}>*`,
        },
      }, {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Dates:* ${start_date} to ${end_date}`,
        },
      }, {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Reason:* ${reason ?? "_none provided_"}`,
        },
      }, {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: action.action_id === "approve_request"
              ? ":white_check_mark: Approved"
              : ":x: Denied",
          },
        ],
      }],
    });

    if (!message.ok) {
      return { error: `Failed to update message: ${message.error}` };
    }

    await client.functions.completeSuccess({
      function_execution_id: body.function_data.execution_id,
      outputs: {},
    });
  },
);
