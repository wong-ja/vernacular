interface Segment {
  text: string;
  start: number;
  end: number;
}

function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const cs = Math.round((s % 1) * 1000);
  const ss = Math.floor(s);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')},${String(cs).padStart(3, '0')}`;
}

function formatVttTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const cs = Math.round((s % 1) * 1000);
  const ss = Math.floor(s);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(cs).padStart(3, '0')}`;
}

export function generateSrt(segments: Segment[]): string {
  let output = '';
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    output += `${i + 1}\n`;
    output += `${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n`;
    output += `${seg.text}\n\n`;
  }
  return output;
}

export function generateVtt(segments: Segment[]): string {
  let output = 'WEBVTT\n\n';
  for (const seg of segments) {
    output += `${formatVttTime(seg.start)} --> ${formatVttTime(seg.end)}\n`;
    output += `${seg.text}\n\n`;
  }
  return output;
}
