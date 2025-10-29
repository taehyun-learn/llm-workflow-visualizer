const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Session files directory
const SESSIONS_DIR = 'C:\\claude-code\\collector\\sessions';

// Helper function to parse session ID from filename
function parseSessionId(filename) {
  const match = filename.match(/sess-([a-f0-9-]+)-S1-T/);
  return match ? match[1] : null;
}

// Helper function to get file timestamp
function getFileTimestamp(filename) {
  // Handle different timestamp formats
  // Format: T2025-07-20T165806998Z.json
  let match = filename.match(/T(\d{4}-\d{2}-\d{2}T\d{9}Z)\.json$/);
  if (match) {
    // Convert timestamp format: 165806998 -> 16:58:06.998
    const dateTime = match[1];
    const datePart = dateTime.substring(0, 10); // 2025-07-20
    const timePart = dateTime.substring(11, 20); // 165806998
    
    if (timePart.length === 9) {
      const hours = timePart.substring(0, 2);
      const minutes = timePart.substring(2, 4);
      const seconds = timePart.substring(4, 6);
      const milliseconds = timePart.substring(6, 9);
      const formattedTime = `${hours}:${minutes}:${seconds}.${milliseconds}`;
      const isoString = `${datePart}T${formattedTime}Z`;
      
      const date = new Date(isoString);
      return isNaN(date.getTime()) ? new Date(0) : date;
    }
  }
  
  // Try standard ISO format
  match = filename.match(/T(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\.json$/);
  if (match) {
    const date = new Date(match[1]);
    return isNaN(date.getTime()) ? new Date(0) : date;
  }
  
  // Fallback to file modification time
  return new Date(0);
}

// API endpoint: Get all sessions
app.get('/api/sessions', (req, res) => {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      return res.json([]);
    }

    const files = fs.readdirSync(SESSIONS_DIR)
      .filter(file => file.startsWith('sess-') && file.endsWith('.json'))
      .map(file => {
        try {
          const sessionId = parseSessionId(file);
          const timestamp = getFileTimestamp(file);
          const filePath = path.join(SESSIONS_DIR, file);
          const stats = fs.statSync(filePath);
          
          // Read the session file to get step count and tags
          let stepCount = 0;
          let title = `Session ${sessionId ? sessionId.substring(0, 8) : 'Unknown'}`;
          let tags = [];
          try {
            const sessionData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (sessionData && sessionData.steps && Array.isArray(sessionData.steps)) {
              stepCount = sessionData.steps.length;
              
              // Extract unique tags from all steps
              const allTags = sessionData.steps.flatMap(step => step.tags || []);
              tags = Array.from(new Set(allTags));
            }
            if (sessionData && sessionData.title) {
              title = sessionData.title;
            }
          } catch (parseError) {
            console.warn(`Error parsing session file ${file}:`, parseError);
          }
          
          return {
            id: sessionId,
            filename: file,
            title: title,
            timestamp: timestamp.getTime() > 0 ? timestamp.toISOString() : stats.mtime.toISOString(),
            modified: stats.mtime.toISOString(),
            size: stats.size,
            stepCount: stepCount,
            tags: tags
          };
        } catch (error) {
          console.warn(`Error processing file ${file}:`, error);
          return null;
        }
      })
      .filter(file => file !== null)
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));

    res.json(files);
  } catch (error) {
    console.error('Error reading sessions:', error);
    res.status(500).json({ error: 'Failed to read sessions' });
  }
});

// API endpoint: Get specific session data
app.get('/api/session/:id', (req, res) => {
  try {
    const sessionId = req.params.id;
    
    if (!fs.existsSync(SESSIONS_DIR)) {
      return res.status(404).json({ error: 'Sessions directory not found' });
    }

    const files = fs.readdirSync(SESSIONS_DIR)
      .filter(file => file.includes(sessionId) && file.endsWith('.json'));
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sessionFile = files[0];
    const filePath = path.join(SESSIONS_DIR, sessionFile);
    const sessionData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    res.json({
      sessionId,
      filename: sessionFile,
      data: sessionData
    });
  } catch (error) {
    console.error('Error reading session:', error);
    res.status(500).json({ error: 'Failed to read session data' });
  }
});

// API endpoint: Get latest session info
app.get('/api/session/latest', (req, res) => {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      return res.json({ sessionId: null });
    }

    const files = fs.readdirSync(SESSIONS_DIR)
      .filter(file => file.startsWith('sess-') && file.endsWith('.json'))
      .map(file => {
        const sessionId = parseSessionId(file);
        const filePath = path.join(SESSIONS_DIR, file);
        const stats = fs.statSync(filePath);
        
        return {
          id: sessionId,
          filename: file,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified - a.modified);

    if (files.length === 0) {
      return res.json({ sessionId: null });
    }

    const latest = files[0];
    res.json({
      sessionId: latest.id,
      filename: latest.filename,
      modified: latest.modified.toISOString()
    });
  } catch (error) {
    console.error('Error getting latest session:', error);
    res.status(500).json({ error: 'Failed to get latest session' });
  }
});

// WebSocket-like functionality using Server-Sent Events
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Watch for file changes
  const watcher = chokidar.watch(SESSIONS_DIR, {
    ignored: /^\./, 
    persistent: true
  });

  watcher.on('change', (filePath) => {
    const filename = path.basename(filePath);
    console.log('File changed:', filename);
    if (filename.startsWith('sess-') && filename.endsWith('.json')) {
      const sessionId = parseSessionId(filename);
      console.log('Session updated:', sessionId);
      const updateData = {
        type: 'session_updated',
        sessionId,
        filename,
        timestamp: new Date().toISOString()
      };
      res.write(`data: ${JSON.stringify(updateData)}\n\n`);
      console.log('Sent update:', updateData);
    }
  });

  watcher.on('add', (filePath) => {
    const filename = path.basename(filePath);
    if (filename.startsWith('sess-') && filename.endsWith('.json')) {
      const sessionId = parseSessionId(filename);
      res.write(`data: ${JSON.stringify({
        type: 'session_created',
        sessionId,
        filename,
        timestamp: new Date().toISOString()
      })}\n\n`);
    }
  });

  req.on('close', () => {
    watcher.close();
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Watching sessions directory: ${SESSIONS_DIR}`);
});