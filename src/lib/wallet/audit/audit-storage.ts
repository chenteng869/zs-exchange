const events: Array<Record<string, unknown>> = [];

const matchesFilter = (event: Record<string, unknown>, filter: Record<string, unknown>): boolean => {
  return Object.entries(filter).every(([key, value]) => {
    if (value === undefined) {
      return true;
    }
    return event[key] === value;
  });
};

export const auditStorage = {
  async saveEvent(event: Record<string, unknown>): Promise<boolean> {
    events.push(event);
    return true;
  },

  async queryEvents(filter: Record<string, unknown>): Promise<{ items: Array<Record<string, unknown>>; total: number }> {
    const items = events.filter((event) => matchesFilter(event, filter));
    return { items, total: items.length };
  },

  async getEvent(eventId: string): Promise<Record<string, unknown> | null> {
    return events.find((event) => event.eventId === eventId) ?? null;
  },

  async getEventCount(filter: Record<string, unknown>): Promise<number> {
    const result = await this.queryEvents(filter);
    return result.total;
  },
};