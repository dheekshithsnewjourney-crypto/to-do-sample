import { describe, expect, it } from 'vitest';
import { parseBackup } from './storage';

describe('parseBackup', () => {
  it('accepts a valid backup and fills in defaults', () => {
    const out = parseBackup(JSON.stringify({ tasks: [{ id: 'a', text: 'Hi' }], lists: [{ id: 'l', name: 'Home' }] }));
    expect(out?.tasks[0]).toMatchObject({ id: 'a', priority: 'med', done: false });
    expect(out?.lists[0].color).toBeTruthy();
  });

  it('rejects malformed input', () => {
    expect(parseBackup('not json')).toBeNull();
    expect(parseBackup('{"tasks": 5}')).toBeNull();
    expect(parseBackup('{"tasks":[{"id":1}]}')).toBeNull();
  });
});
