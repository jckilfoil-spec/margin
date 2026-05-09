import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { App } from '../App';

describe('App', () => {
  it('renders the paper surface', () => {
    const { container } = render(<App />);
    const surface = container.querySelector('.paper-surface');
    expect(surface).not.toBeNull();
  });
});
