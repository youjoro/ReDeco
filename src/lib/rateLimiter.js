const rateLimiter = {
  requests: [],
  canRequest() {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < 60000);
    if (this.requests.length >= 80) return false;
    this.requests.push(now);
    return true;
  },
  remaining() {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < 60000);
    return 80 - this.requests.length;
  },
};

export default rateLimiter;
