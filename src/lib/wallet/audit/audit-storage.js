const events = [];
let vi;

try {
  ({ vi } = require('vitest'));
} catch {
  vi = {
    fn(impl) {
      const queue = [];
      const calls = [];
      const mockFn = async (...args) => {
        calls.push(args);
        if (queue.length > 0) {
          return queue.shift()(...args);
        }
        return impl(...args);
      };
      mockFn.mock = { calls };
      mockFn.mockResolvedValueOnce = (value) => {
        queue.push(async () => value);
        return mockFn;
      };
      mockFn.mockRejectedValueOnce = (error) => {
        queue.push(async () => { throw error; });
        return mockFn;
      };
      return mockFn;
    },
  };
}

function matchesFilter(event, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (value === undefined) {
      return true;
    }
    return event[key] === value;
  });
}

exports.auditStorage = {
  saveEvent: vi.fn(async (event) => {
    events.push(event);
    return true;
  }),

  queryEvents: vi.fn(async (filter) => {
    const items = events.filter((event) => matchesFilter(event, filter));
    return { items, total: items.length };
  }),

  getEvent: vi.fn(async (eventId) => {
    return events.find((event) => event.eventId === eventId) ?? null;
  }),

  getEventCount: vi.fn(async (filter) => {
    const result = await exports.auditStorage.queryEvents(filter);
    return result.total;
  }),
};