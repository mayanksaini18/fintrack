import { describe, expect, it } from 'vitest';
import { renderInsightsMarkdown } from './markdown';

describe('renderInsightsMarkdown', () => {
  it('still renders bold text and bullet lists', () => {
    expect(renderInsightsMarkdown('**Food** is 40% of spending\n- Cut Swiggy\n- Cook at home')).toBe(
      '<strong>Food</strong> is 40% of spending<br/><ul><li>Cut Swiggy</li><br/><li>Cook at home</li></ul>',
    );
  });

  it('shows HTML in the reply as text instead of running it', () => {
    const html = renderInsightsMarkdown('You paid <img src=x onerror="alert(document.cookie)"> twice');
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(document.cookie)&quot;&gt;');
  });

  it('escapes HTML inside bold text and bullets too', () => {
    const html = renderInsightsMarkdown('**<script>steal()</script>**\n- <a href="javascript:alert(1)">tap</a>');
    expect(html).not.toMatch(/<script|<a /);
    expect(html).toContain('<strong>&lt;script&gt;steal()&lt;/script&gt;</strong>');
  });

  it('keeps ampersands readable', () => {
    expect(renderInsightsMarkdown('Food & drinks')).toBe('Food &amp; drinks');
  });
});
