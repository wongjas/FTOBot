import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

// Define the inputs needed for a time off request
export const RemoveFTO = DefineFunction({
  callback_id: "remove_fto",
  title: "Remove FTO",
  description: "Delete a request for FTO by id",
  source_file: "functions/remove_fto.ts",
  input_parameters: {
    properties: {
      request_id: {
        type: Schema.types.string,
        description: "The request to remove",
      },
    },
    required: ["request_id"],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

// Remove an FTO request by id
export default SlackFunction(
  RemoveFTO,
  async ({ inputs, client }) => {
    const { request_id } = inputs;

    // Remove the request
    const deleteResponse = await client.apps.datastore.delete({
      datastore: "fto_requests",
      id: request_id,
    });

    if (!deleteResponse.ok) {
      return { error: `Failed to delete requests: ${deleteResponse.error}` };
    }

    return { outputs: {} };
  },
);
