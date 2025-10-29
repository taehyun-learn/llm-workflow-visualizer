const { spawn } = require('child_process');

// Read all data from stdin
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk.toString();
});

process.stdin.on('end', () => {
  try {
    const hookData = JSON.parse(inputData);
    console.log(`[DEBUG] Command hook data received:`, JSON.stringify(hookData, null, 2));
    
    if (hookData.hook_event_name === 'PostToolUse' && hookData.tool_name === 'Bash') {
      // Extract command from tool_input (which might be an object)
      let command = '';
      if (typeof hookData.tool_input === 'string') {
        command = hookData.tool_input;
      } else if (typeof hookData.tool_input === 'object' && hookData.tool_input !== null) {
        // If tool_input is an object, try to extract the command field
        command = hookData.tool_input.command || JSON.stringify(hookData.tool_input);
      }
      
      console.log(`[DEBUG] Extracted command: ${command}`);
      
      // Call the collector with the command data, passing session ID via environment variable
      const collector = spawn('node', [
        'C:\\claude-code\\collector\\index.js',
        '--type', 'command',
        '--command', command,
        '--stdout', hookData.tool_output || '',
        '--stderr', hookData.tool_error || '',
        '--exitCode', hookData.tool_exit_code || '0'
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
    console.error(`[DEBUG] Error parsing command hook data:`, error.message);
    console.error(`[DEBUG] Raw input:`, inputData);
  }
});