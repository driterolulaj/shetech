export default {
  order: 3,
  featured: false,
  visual: 'chart',
  services: ['ai', 'automation'],

  title: 'The Forex Pattern Scanner',
  headline: "A bot that watches the charts all day so traders don't have to",
  tags: ['AI', 'Pattern recognition', 'Automation', 'Fintech', 'Telegram integration', 'Real-time data'],

  summary:
    'An automated scanner that spots classic chart patterns across forex pairs and sends ready-to-act trade signals to Telegram, with entry, take-profit and stop-loss included.',
  challenge:
    "Forex never sleeps, but traders do. Good setups like M and W patterns can form at 3 a.m. on a pair nobody is watching. Tracking dozens of currency pairs across several timeframes by hand is tiring and inconsistent, and by the time a pattern is spotted, the best entry is often gone. The client wanted a tireless pair of eyes: something that scans the market around the clock, recognises patterns the way an experienced trader would, and only speaks up when a setup is worth acting on.",
  solution:
    'We built a pattern-recognition scanner that reads the market continuously. It identifies chart formations such as M patterns (double tops) and W patterns (double bottoms), then checks each one against a set of conditions before sending a signal. Think of it as a very picky analyst: it sees a lot of patterns, but it only messages the team when everything lines up.',

  steps: [
    { title: 'Watch', body: 'Live price data for the selected currency pairs and timeframes, around the clock.' },
    { title: 'Spot the shape', body: 'The turning points that make up an M or a W: two peaks at a similar height for an M, two troughs for a W.', ai: true },
    {
      title: 'Check the conditions',
      body: 'A shape alone isn’t enough. A checklist confirms the pattern is real: has price broken the neckline, does the overall trend support the trade, is the pattern clean enough to trust?',
      ai: true,
    },
    { title: 'Calculate the trade', body: 'The entry, a stop-loss placed beyond the pattern, and a take-profit target based on the pattern’s size.' },
    { title: 'Send the signal', body: 'A formatted alert goes straight to Telegram within seconds, with the full trade plan.' },
  ],

  highlights: [
    'Recognises M patterns (double tops) and W patterns (double bottoms) across pairs and timeframes',
    'Only signals once the neckline breaks, the trend agrees and the pattern is clean',
    'Entry, stop-loss and take-profit worked out from the pattern itself',
    'Ready-to-act Telegram alerts, e.g. "🟢 BUY EUR/USD · W (double bottom), 1H · Entry 1.0845 · 🎯 TP 1.0910 · 🛑 SL 1.0815"',
  ],

  outcomes: [
    'Setups that form overnight, on pairs nobody is watching, are no longer missed.',
    'Signals arrive within seconds, so traders get the full trade plan on their phone.',
    'Traders hear only about setups worth acting on, not every shape on the chart.',
  ],
  // Add measured numbers once confirmed, e.g. { value: 'X', label: 'Currency pairs scanned 24/5' },
  // { value: '< X s', label: 'From pattern to Telegram' }, { value: 'X', label: 'Signals per week' },
  // { value: 'X', label: "Traders in the client's Telegram group" }
  results: [],
  quote: null,
}
