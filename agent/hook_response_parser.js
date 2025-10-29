const { spawn } = require('child_process');
const fs = require('fs');

// Function to extract the latest assistant response from transcript
function extractLatestAssistantResponse(transcriptPath) {
  try {
    if (!fs.existsSync(transcriptPath)) {
      console.error(`[DEBUG] Transcript file not found: ${transcriptPath}`);
      return null;
    }
    
    const content = fs.readFileSync(transcriptPath, 'utf8');
    const lines = content.trim().split('\n').filter(line => line.trim());
    
    // Find the latest assistant message
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.type === 'assistant' && entry.message && entry.message.content) {
          // Extract text content from the message
          const textContent = entry.message.content
            .filter(item => item.type === 'text')
            .map(item => item.text)
            .join('\n');
          
          if (textContent) {
            return textContent;
          }
        }
      } catch (parseError) {
        continue; // Skip malformed lines
      }
    }
    
    console.error(`[DEBUG] No assistant response found in transcript`);
    return null;
  } catch (error) {
    console.error(`[DEBUG] Error reading transcript:`, error.message);
    return null;
  }
}

// Read all data from stdin
let inputData = '';
process.stdin.on('data', (chunk) => {
  inputData += chunk.toString();
});

process.stdin.on('end', () => {
  try {
    const hookData = JSON.parse(inputData);
    console.log(`[DEBUG] Response hook data received:`, JSON.stringify(hookData, null, 2));
    
    // Check for Claude response completion events
    if (hookData.hook_event_name === 'Stop') {
      // Extract the actual response from transcript
      const actualResponse = extractLatestAssistantResponse(hookData.transcript_path);
      
      if (!actualResponse) {
        console.error(`[DEBUG] Could not extract response from transcript: ${hookData.transcript_path}`);
        return;
      }
      
      console.log(`[DEBUG] Extracted response (${actualResponse.length} chars): ${actualResponse.substring(0, 100)}...`);
      
      // Call the collector with the response
      const collector = spawn('node', [
        'C:\\claude-code\\collector\\index.js',
        '--type', 'assistant_response',
        '--response', actualResponse,
        '--promptGroup', hookData.prompt_group || ''
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
        console.log(`[DEBUG] Response collector finished with code: ${code}`);
      });
    }
  } catch (error) {
    console.error(`[DEBUG] Error parsing response hook data:`, error.message);
    console.error(`[DEBUG] Raw input:`, inputData);
  }
});