import { describe, expect, it } from 'vitest';
import { accentVars, contrast, inkFor, parseHex, readableOn } from './color';

describe('colour helpers', () => {
  it('parses 3 and 6 digit hex and rejects everything else', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('#D62839')).toEqual([214, 40, 57]);
    expect(parseHex('red')).toBeNull();
    expect(parseHex('#12345')).toBeNull();
    expect(parseHex('#fff; background: url(x)')).toBeNull();
    expect(parseHex(null)).toBeNull();
  });

  it('computes WCAG contrast ratios', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrast('#FFFFFF', '#D62839')).toBeGreaterThan(4.5);
  });

  it('picks an ink that passes AA on any fill', () => {
    expect(inkFor('#D62839')).toBe('#FFFFFF');
    expect(inkFor('#FFC53D')).toBe('#000000');
    // sweep the grey ramp and the colour cube corners: the chosen ink never drops below 4.5:1
    for (let v = 0; v < 256; v += 5) {
      const h = v.toString(16).padStart(2, '0');
      for (const fill of [`#${h}${h}${h}`, `#${h}0000`, `#00${h}00`, `#0000${h}`, `#${h}${h}00`, `#00${h}${h}`]) {
        expect(contrast(inkFor(fill), fill)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('darkens or lightens an accent until it is readable as text', () => {
    const onLight = readableOn('#FFC53D', ['#FFFFFF', '#FAFAFA'], '#000000');
    expect(contrast(onLight, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(onLight, '#FAFAFA')).toBeGreaterThanOrEqual(4.5);
    const onDark = readableOn('#1C3D8F', ['#151515', '#0A0A0A'], '#FFFFFF');
    expect(contrast(onDark, '#151515')).toBeGreaterThanOrEqual(4.5);
    // a colour that already passes is left alone
    expect(readableOn('#A4161A', ['#FFFFFF'], '#000000')).toBe('#A4161A');
  });

  it('builds accent variables and refuses invalid colours', () => {
    expect(accentVars('#E8590C', ['#FFFFFF'], false)).toMatchObject({ '--accent': '#E8590C', '--accent-ink': '#000000' });
    expect(accentVars('javascript:alert(1)', ['#FFFFFF'], false)).toBeNull();
  });
});
