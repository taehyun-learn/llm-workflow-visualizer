const { spawn } = require('child_process');

// Read all data from stdin
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk.toString();
});

process.stdin.on('end', () => {
  try {
    const hookData = JSON.parse(inputData);
    console.log(`[DEBUG] File edit hook data received:`, JSON.stringify(hookData, null, 2));
    
    if (hookData.hook_event_name === 'PostToolUse' && 
        (hookData.tool_name === 'Edit' || hookData.tool_name === 'Write')) {
      
      let filePath = '';
      let action = 'update';
      
      // Parse tool input to extract file path
      if (hookData.tool_input) {
        let toolInput;
        
        // Handle both string and object tool_input
        if (typeof hookData.tool_input === 'string') {
          try {
            toolInput = JSON.parse(hookData.tool_input);
          } catch (e) {
            console.error('[DEBUG] Could not parse tool input as JSON:', e.message);
            toolInput = {};
          }
        } else if (typeof hookData.tool_input === 'object') {
          toolInput = hookData.tool_input;
        } else {
          toolInput = {};
        }
        
        filePath = toolInput.file_path || '';
        action = hookData.tool_name === 'Write' ? 'create' : 'update';
        
        console.log(`[DEBUG] Extracted file path: ${filePath}, action: ${action}`);
      }
      
      // Call the collector with the file edit data, passing session ID via environment variable
      const collector = spawn('node', [
        'C:\\claude-code\\collector\\index.js',
        '--type', 'file_edit',
        '--file', filePath,
        '--action', action
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
    console.error(`[DEBUG] Error parsing file edit hook data:`, error.message);
    console.error(`[DEBUG] Raw input:`, inputData);
  }
});