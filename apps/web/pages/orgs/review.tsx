import { useState } from 'react';
import Button from '../../components/ui/Button';

interface ReviewItem {
  id: string;
  pair: string;
  domain: string;
  time: string;
  source: string;
  translation: string;
  glossaryTerms: number;
  confidence: number;
}

const mockReviews: ReviewItem[] = [
  { id: '1', pair: 'Tagalog \u2192 English', domain: 'medical', time: '3 min ago', source: 'Kailangan ko ng reseta para sa aking presyon ng dugo.', translation: 'I need a prescription for my blood pressure.', glossaryTerms: 2, confidence: 68 },
  { id: '2', pair: 'Hmong \u2192 English', domain: 'education', time: '15 min ago', source: 'Kuv tus me nyuam xav tau kev pab nrog lej.', translation: 'My child needs help with math.', glossaryTerms: 1, confidence: 72 },
  { id: '3', pair: 'Cantonese \u2192 English', domain: 'civic', time: '1h ago', source: '\u6211\u60F3\u7533\u8ACB\u793E\u6703\u5B89\u5168\u7DB2\u7D61\u3002', translation: 'I want to apply for the social safety net.', glossaryTerms: 3, confidence: 55 },
];

export default function OrgReview() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="max-w-container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Review queue</h1>
        <span className="text-sm text-text-secondary">{mockReviews.length} pending</span>
      </div>

      <div className="space-y-4">
        {mockReviews.length === 0 && (
          <div className="bg-surface-1 border border-border rounded-lg p-12 text-center">
            <p className="text-text-tertiary text-sm">No pending reviews. All caught up!</p>
          </div>
        )}

        {mockReviews.map((item) => (
          <div key={item.id} className="bg-surface-1 border border-border rounded-lg overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-text-primary">{item.pair}</span>
                <span className="text-xs text-text-secondary bg-surface-2 px-2 py-0.5 rounded">{item.domain}</span>
                <span className="text-xs text-text-tertiary">{item.time}</span>
              </div>
              <button
                onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                className="text-xs text-accent hover:underline cursor-pointer"
              >
                {expanded === item.id ? 'Collapse' : 'Review'}
              </button>
            </div>

            {expanded === item.id && (
              <div className="p-4 space-y-4">
                {/* Side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Source</p>
                    <p className="text-sm text-text-primary bg-surface-2 rounded p-3">{item.source}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Translation</p>
                    <p className="text-sm text-text-primary bg-surface-2 rounded p-3">
                      {item.translation}
                      <span className="block text-xs text-accent mt-1">
                        {item.glossaryTerms} community term{item.glossaryTerms > 1 ? 's' : ''} applied
                      </span>
                    </p>
                  </div>
                </div>

                {/* Confidence */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-text-secondary">Confidence:</span>
                  <span className={item.confidence >= 70 ? 'text-success-text' : 'text-warning-text'}>{item.confidence}%</span>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button size="sm">Approve</Button>
                  <Button variant="secondary" size="sm">Edit</Button>
                  <Button variant="secondary" size="sm">Flag term</Button>
                  <Button variant="destructive" size="sm">Reject</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
