import Heatmap, { type Options } from 'ol/layer/Heatmap'
import WebGLVectorLayerRenderer from 'ol/renderer/webgl/VectorLayer'
import { ShaderBuilder } from 'ol/render/webgl/ShaderBuilder'
import { asArray } from 'ol/color'
import { HeatmapLevel, heatmapLevelColours } from './heatmapLevels'

type BandedHeatmapOptions = Pick<Options, 'source' | 'visible' | 'zIndex' | 'opacity'> & {
  radius: number
  blur: number
}

export const heatmapBandShader = `
precision mediump float;
uniform sampler2D u_image;
uniform float u_opacity;
uniform vec4 u_enabled;
uniform vec3 u_low;
uniform vec3 u_medium;
uniform vec3 u_high;
uniform vec3 u_veryHigh;
varying vec2 v_texCoord;

void main() {
  float density = texture2D(u_image, v_texCoord).a;
  vec3 colour;
  float enabled;
  if (density < 0.25) {
    colour = u_low;
    enabled = u_enabled.x;
  } else if (density < 0.5) {
    colour = u_medium;
    enabled = u_enabled.y;
  } else if (density < 0.75) {
    colour = u_high;
    enabled = u_enabled.z;
  } else {
    colour = u_veryHigh;
    enabled = u_enabled.w;
  }
  float alpha = density * u_opacity * enabled;
  gl_FragColor = vec4(colour * alpha, alpha);
}
`

export default class BandedHeatmap extends Heatmap {
  private levels: Record<HeatmapLevel, boolean> = { low: true, medium: true, high: true, veryHigh: true }

  constructor(options: BandedHeatmapOptions) {
    super(options)
  }

  setLevels(levels: Record<HeatmapLevel, boolean>): void {
    this.levels = { ...levels }
    this.changed()
  }

  override createRenderer(): WebGLVectorLayerRenderer {
    const builder = new ShaderBuilder()
      .addUniform('u_radius', 'float')
      .addUniform('u_blur', 'float')
      .addAttribute('a_weight', 'float')
      .setSymbolSizeExpression('vec2(2.0 * (u_radius + u_blur))')
      .setSymbolColorExpression(
        'vec4(a_weight * smoothstep(0.0, 1.0, (1.0 - length(2.0 * coordsPx / v_quadSizePx)) * u_radius / max(u_blur, 1.0)))',
      )

    const colour = (level: HeatmapLevel): number[] =>
      asArray(heatmapLevelColours[level])
        .slice(0, 3)
        .map(v => v / 255)

    return new WebGLVectorLayerRenderer(this, {
      className: this.getClassName(),
      variables: {},
      style: {
        builder,
        attributes: {
          weight: {
            size: 1,
            callback: feature => {
              const weight = feature.get('weight')
              return weight === undefined ? 1 : Math.min(1, Math.max(0, Number(weight)))
            },
          },
        },
        uniforms: {
          u_radius: () => this.getRadius(),
          u_blur: () => this.getBlur(),
        },
      },
      postProcesses: [
        {
          fragmentShader: heatmapBandShader,
          uniforms: {
            u_opacity: () => this.getOpacity(),
            u_enabled: () =>
              ['low', 'medium', 'high', 'veryHigh'].map(level => Number(this.levels[level as HeatmapLevel])),
            u_low: colour('low'),
            u_medium: colour('medium'),
            u_high: colour('high'),
            u_veryHigh: colour('veryHigh'),
          },
        },
      ],
    })
  }
}
