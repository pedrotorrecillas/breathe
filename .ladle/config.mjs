/** @type {import("@ladle/react").UserConfig} */
export default {
  stories: ["src/**/*.stories.{js,jsx,ts,tsx,mdx}"],
  addons: {
    a11y: {
      enabled: true,
    },
  },
  appendToHead: `<style>
    :root {
      --ladle-main-padding: 1.5rem;
      --ladle-main-padding-mobile: 1rem;
    }
  </style>`,
};
