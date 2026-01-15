import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_vimroqyctvbzuyhcgzmb",
  // Your trigger tasks are in the "trigger" folder
  dirs: ["./trigger"],
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  maxDuration: 3600, // 60 minutes
});
