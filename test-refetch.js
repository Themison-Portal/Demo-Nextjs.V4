// Test script to verify refetchOnWindowFocus behavior
// This would run in browser console

let clickCount = 0;
let refetchCount = 0;

// Override fetch to count refetches
const originalFetch = window.fetch;
window.fetch = function(...args) {
  if (args[0]?.includes('/tasks')) {
    refetchCount++;
    console.log(`[REFETCH ${refetchCount}] Tasks query triggered`);
  }
  return originalFetch.apply(this, args);
};

// Track clicks
document.addEventListener('click', (e) => {
  clickCount++;
  console.log(`[CLICK ${clickCount}] Target:`, e.target.tagName, e.target.className);
  console.log(`Total refetches so far: ${refetchCount}`);
}, true);

console.log('Test script loaded. Click on cards and watch the console.');
