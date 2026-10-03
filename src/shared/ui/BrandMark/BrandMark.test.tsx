// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import BrandMark from './BrandMark';
import { ofType } from '../../test/dom';

const markIn = (container: HTMLElement) => ofType(container.querySelector('svg'), SVGSVGElement);

describe('BrandMark', () => {
  it('draws the 2×2 mark with one terracotta square, hidden from assistive technology', () => {
    const { container } = render(<BrandMark />);
    const svg = markIn(container);

    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.querySelectorAll('rect')).toHaveLength(4);
    expect(svg.querySelectorAll('.brand-mark__warm')).toHaveLength(1);
  });

  it('adds the class it is given to its own', () => {
    const { container } = render(<BrandMark className="profile-create__mark" />);

    expect(markIn(container).getAttribute('class')).toBe('brand-mark profile-create__mark');
  });
});
