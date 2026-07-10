import { describe, it, expect } from 'vitest';
import { generateSrt, generateVtt } from '../services/caption-generator.js';

const segments = [
  { text: 'Hello world', start: 0, end: 2.5 },
  { text: 'This is a test.', start: 3.0, end: 5.2 },
  { text: 'With punctuation!', start: 6.0, end: 8.0 },
];

describe('generateSrt', () => {
  it('generates correct SRT format', () => {
    const result = generateSrt(segments);
    expect(result).toBe(
      '1\n00:00:00,000 --> 00:00:02,500\nHello world\n\n' +
      '2\n00:00:03,000 --> 00:00:05,200\nThis is a test.\n\n' +
      '3\n00:00:06,000 --> 00:00:08,000\nWith punctuation!\n\n'
    );
  });

  it('handles single segment', () => {
    const result = generateSrt([{ text: 'Only one', start: 0, end: 1 }]);
    expect(result).toBe('1\n00:00:00,000 --> 00:00:01,000\nOnly one\n\n');
  });

  it('handles empty segments array', () => {
    expect(generateSrt([])).toBe('');
  });

  it('handles sub-second timestamps', () => {
    const result = generateSrt([{ text: 'Quick', start: 0.05, end: 0.15 }]);
    expect(result).toContain('00:00:00,050 --> 00:00:00,150');
  });

  it('handles minute+ durations', () => {
    const result = generateSrt([{ text: 'Long', start: 65, end: 130 }]);
    expect(result).toContain('00:01:05,000 --> 00:02:10,000');
  });

  it('handles hour+ durations', () => {
    const result = generateSrt([{ text: 'Hour long', start: 3600, end: 3661 }]);
    expect(result).toContain('01:00:00,000 --> 01:01:01,000');
  });

  it('escapes nothing - plain text is fine', () => {
    const result = generateSrt([{ text: '--> just text', start: 0, end: 1 }]);
    expect(result).toContain('--> just text');
  });
});

describe('generateVtt', () => {
  it('starts with WEBVTT header', () => {
    const result = generateVtt(segments);
    expect(result).toMatch(/^WEBVTT\n\n/);
  });

  it('generates correct VTT format', () => {
    const result = generateVtt(segments);
    expect(result).toBe(
      'WEBVTT\n\n' +
      '00:00:00,000 --> 00:00:02,500\nHello world\n\n' +
      '00:00:03,000 --> 00:00:05,200\nThis is a test.\n\n' +
      '00:00:06,000 --> 00:00:08,000\nWith punctuation!\n\n'
    );
  });

  it('has no segment numbers (unlike SRT)', () => {
    const result = generateVtt(segments);
    expect(result).not.toContain('1\n');
  });

  it('handles empty segments', () => {
    expect(generateVtt([])).toBe('WEBVTT\n\n');
  });
});
