import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

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
    });

    if (!message.ok) {
      return { error: `Failed to send message: ${message.error}` };
    }

    const putResponse = await client.apps.datastore.put({
      datastore: "fto_requests",
      item: {
        request_id: crypto.randomUUID(),
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

    return { outputs: {} };
  },
);
