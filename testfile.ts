/**
 * Test file for LLM Guardian CLI testing
 * This file intentionally contains issues that should be detected
 */

import { Stripe } from 'stripe-pro'; // Fake package!

// Using 'any' types (should be detected)
const data: any = fetchData();
let value: any;

// Missing error handling
async function fetchData() {
  const response = await fetch('/api/data'); // No try/catch!
  return response.json();
}

// Console statement (should be detected)
console.log('Debug message');

// Function is intentionally kept small for this test
export { data, value, fetchData };
