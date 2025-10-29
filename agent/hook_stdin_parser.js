const { spawn } = require('child_process');

// Read all data from stdin
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk.toString();
});

process.stdin.on('end', () => {
  try {
    const hookData = JSON.parse(inputData);
    console.log(`[DEBUG] Hook data received:`, JSON.stringify(hookData, null, 2));
    
    if (hookData.hook_event_name === 'UserPromptSubmit' && hookData.prompt) {
      // Call the collector with the prompt, passing session ID via environment variable
      const collector = spawn('node', [
        'C:\\claude-code\\collector\\index.js',
        '--type', 'prompt',
        '--prompt', hookData.prompt
      ], {
        env: {
          ...process.env,
          CLAUDE_CODE_SESSION_ID: hookData.session_id || process.env.CLAUDE_CODE_SESSION_ID
        }
      });
      
      collector.stdout.on('data', (data) => {
        console.log(data.toString());
      });
      
      collector.stderr.on('data', (data) => {
        console.error(data.toString());
      });
      
      collector.on('close', (code) => {
        console.log(`[DEBUG] Collector finished with code: ${code}`);
      });
    }
  } catch (error) {
    console.error(`[DEBUG] Error parsing hook data:`, error.message);
    console.error(`[DEBUG] Raw input:`, inputData);
  }
});