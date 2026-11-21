import * as THREE from 'three';
import config from '../../../meditations.config.json' with { type: 'json' };

export const PALETTE = config.palette;

export const threeColor = (hex: string) => new THREE.Color(hex);

export type ThemeCssVars = Record<`--color-${string}`, string>;

export const buildThemeCssVars = (): ThemeCssVars => ({
  '--color-base': PALETTE.base,
  '--color-highlight': PALETTE.highlight,
  '--color-surface': PALETTE.surface,
  '--color-text': PALETTE.text,
  '--color-amber-bright': PALETTE.amberBright,
  '--color-amber-deep': PALETTE.amberDeep,
  '--color-purple': PALETTE.purple,
  '--color-purple-bright': PALETTE.purpleBright,
  '--color-purple-deep': PALETTE.purpleDeep,
});
