export const plugins = {
  tailwindcss: { config: './config/tailwind.config.js' },
  autoprefixer: {
    overrideBrowserslist: ['> 1%', 'last 2 versions'],
    cascade: false
  },
};