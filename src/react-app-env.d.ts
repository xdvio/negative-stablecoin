/// <reference types="react-scripts" />

/**
 * Declaring this namespace gives us typing on the `process.env` global.
 * Note that these env variables are embedded at BUILD time, not RUN time.
 *
 * You can read more about env vars in React here:
 * https://create-react-app.dev/docs/adding-custom-environment-variables/
 */
declare namespace NodeJS {
  interface ProcessEnv {
    // The environment that the React app was built in
    NODE_ENV: string

    // The path to the public folder
    // https://create-react-app.dev/docs/using-the-public-folder/
    PUBLIC_URL: string
  }
}
