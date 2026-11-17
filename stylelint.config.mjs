export default {
  customSyntax: 'postcss-scss',
  plugins: ['./stylelint/gds-colour-plugin.mjs'],
  rules: {
    'hmpps/gds-colour': true,
  },
}
