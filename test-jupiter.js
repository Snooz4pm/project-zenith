/**
 * Test Jupiter API response time and token count
 */

async function testJupiterAPI() {
  const startTime = Date.now();

  try {
    console.log('[Test] Fetching from Jupiter API...');

    const response = await fetch('https://token.jup.ag/all', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const fetchTime = Date.now() - startTime;
    console.log(`[Test] Fetch completed in ${fetchTime}ms`);

    if (!response.ok) {
      console.error(`[Test] HTTP error: ${response.status} ${response.statusText}`);
      return;
    }

    const tokens = await response.json();
    const totalTime = Date.now() - startTime;

    console.log('\n=== JUPITER API TEST RESULTS ===');
    console.log(`Total time: ${totalTime}ms`);
    console.log(`Token count: ${tokens.length}`);
    console.log(`Response size: ~${JSON.stringify(tokens).length} bytes`);
    console.log('\nSample token:');
    console.log(JSON.stringify(tokens[0], null, 2));
    console.log('\nSample token (last):');
    console.log(JSON.stringify(tokens[tokens.length - 1], null, 2));

    // Test filtering
    const validTokens = tokens.filter(token => {
      if (!token.symbol || token.symbol.length > 12) return false;
      if (!token.name || token.name.length > 50) return false;
      return true;
    });

    console.log(`\nValid tokens after filtering: ${validTokens.length}/${tokens.length}`);
    console.log(`Filtered out: ${tokens.length - validTokens.length} tokens`);

  } catch (error) {
    console.error('[Test] Error:', error.message);
  }
}

testJupiterAPI();
