/**
 * Cloudflare Pages _worker.js (Root entry)
 * Re-exports the full-stack worker from public/_worker.js
 */
import worker from './public/_worker.js';
export default worker;
