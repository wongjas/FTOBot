import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { FTORequestsDatastore } from "../datastores/fto_requests.ts";

// Define the inputs needed for a time off request
export const LookupFTO = DefineFunction({
  callback_id: "lookup_fto",
  title: "Lookup FTO",
  description: "Query the submitted FTO requests",
  source_file: "functions/lookup_fto.ts",
  input_parameters: {
    properties: {
      employee: {
        type: Schema.slack.types.user_id,
        description: "The employee to search for",
      },
      searcher_id: {
        type: Schema.slack.types.user_id,
        description: "The user to send results to",
      },
    },
    required: ["employee", "searcher_id"],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

// Lookup FTO requests for a given employee
export default SlackFunction(
  LookupFTO,
  async ({ inputs, client }) => {
    const { employee, searcher_id } = inputs;

    // Query the datastore
    const getResponse = await client.apps.datastore.query<
      typeof FTORequestsDatastore.definition
    >({
      datastore: "fto_requests",
      expression: "#employee_id = :employee",
      expression_attributes: { "#employee_id": "employee" },
      expression_values: { ":employee": employee },
    });

    if (!getResponse.ok) {
      return { error: `Failed to get requests: ${getResponse.error}` };
    }

    // Create a list of requests
    const { items } = getResponse;
    const sections = items.length > 0
      ? getResponse.items.flatMap((req) => {
        if (req.reason) {
          return [{
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                `- ${req.start_date} - ${req.end_date}  \`${req.request_id}\``,
            },
          }, {
            type: "context",
            elements: [
              {
                type: "plain_text",
                text: req.reason,
                emoji: true,
              },
            ],
          }];
        }

        // Requests without a reason
        return [{
          type: "section",
          text: {
            type: "mrkdwn",
            text:
              `- ${req.start_date} - ${req.end_date}  \`${req.request_id}\``,
          },
        }];
      })
      : [{
        type: "section",
        text: {
          type: "mrkdwn",
          text: "No PTO requests have been created",
        },
      }];

    // Send a list of requests to the searcher
    const message = await client.chat.postMessage({
      channel: searcher_id,
      text: `*PTO requests for <@${employee}>*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*FTO requests for <@${employee}>*`,
          },
        },
        ...sections,
      ],
    });

    if (!message.ok) {
      return { error: `Failed to send message: ${message.error}` };
    }

    return { outputs: {} };
  },
);
