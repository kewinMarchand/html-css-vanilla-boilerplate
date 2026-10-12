const LATENCY_MS = 300

export const sendContactMessage = (values) =>
  new Promise((resolve) => setTimeout(() => resolve(values), LATENCY_MS))
