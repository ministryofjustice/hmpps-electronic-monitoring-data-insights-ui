/* eslint-disable import/no-extraneous-dependencies */
import stylelint from 'stylelint'

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint

export const ruleName = 'hmpps/gds-colour'

const PALETTE = {
  '4c2c92': 'govuk-colour("purple")',
  '6f72af': 'govuk-colour("light-purple")',
  '912b88': 'govuk-colour("bright-purple")',
  d53880: 'govuk-colour("pink")',
  f499be: 'govuk-colour("light-pink")',
  d4351c: 'govuk-colour("red")',
  f47738: 'govuk-colour("orange")',
  b58840: 'govuk-colour("brown")',
  ffdd00: 'govuk-colour("yellow")',
  '85994b': 'govuk-colour("light-green")',
  '00703c': 'govuk-colour("green")',
  '28a197': 'govuk-colour("turquoise")',
  '5694ca': 'govuk-colour("light-blue")',
  '1d70b8': 'govuk-colour("blue")',
  '003078': 'govuk-colour("dark-blue")',
  '0b0c0c': 'govuk-colour("black")',
  // mid-grey, dark-grey and light-grey are deprecated in govuk-frontend 6
  '505a5f': 'govuk-colour("black", $variant: "tint-25")',
  b1b4b6: 'govuk-colour("black", $variant: "tint-80")',
  f3f2f1: 'govuk-colour("black", $variant: "tint-95")',
  ffffff: 'govuk-colour("white")',
}

const HEX = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g

const messages = ruleMessages(ruleName, {
  exact: (hex, replacement) => `Use ${replacement} instead of "${hex}"`,
  custom: (hex, replacement, distance) =>
    `"${hex}" is not a GOV.UK palette colour. Nearest is ${replacement} (distance ${distance}); use it unless a custom colour is deliberate`,
})

const expand = hex => (hex.length === 3 ? [...hex].map(c => c + c).join('') : hex).toLowerCase()

const channels = hex => [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))

const nearest = hex => {
  const target = channels(hex)
  const distance = candidate => Math.sqrt(channels(candidate).reduce((sum, c, i) => sum + (c - target[i]) ** 2, 0))
  const best = Object.keys(PALETTE).reduce((a, b) => (distance(b) < distance(a) ? b : a))
  return { replacement: PALETTE[best], distance: Math.round(distance(best)) }
}

const rule = primary => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary })) return

  root.walkDecls(decl => {
    ;[...decl.value.matchAll(HEX)].forEach(match => {
      const hex = expand(match[1])
      const exact = PALETTE[hex]
      const index = decl.toString().indexOf(match[0], decl.prop.length)
      const location = { result, ruleName, node: decl, index, endIndex: index + match[0].length }

      if (exact) {
        report({
          ...location,
          message: messages.exact(match[0], exact),
          fix: () => {
            // Only exact palette matches are autofixed; custom colours are left for a human
            // eslint-disable-next-line no-param-reassign
            decl.value = decl.value.replace(match[0], exact)
          },
        })
      } else {
        const { replacement, distance } = nearest(hex)
        report({ ...location, message: messages.custom(match[0], replacement, distance) })
      }
    })
  })
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = { fixable: true }

export default createPlugin(ruleName, rule)
