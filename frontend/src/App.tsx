import React, { useState, useEffect, useCallback } from "react";
import { Layout, Typography, Switch, Badge, Avatar, ConfigProvider, theme, Button, message } from "antd";
import { BulbOutlined, BulbFilled, CodeOutlined, ArrowLeftOutlined, RobotOutlined, PlayCircleOutlined, PauseCircleOutlined } from "@ant-design/icons";
import SessionList from "./components/SessionList";
import StepList from "./components/StepList";
import FlowVisualization from "./components/FlowVisualization";
import StepDrawer from "./components/StepDrawer";
import SessionCompareView from "./components/SessionCompareView";
import ResponsePanel from "./components/ResponsePanel";
import { createReplaySession, mockExecuteStep } from "./utils/replayUtils";
import type { Step, Session, SessionSummary } from "./types/index";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function App() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [view, setView] = useState<'sessions' | 'workflow' | 'compare'>('sessions');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [responsePanelOpen, setResponsePanelOpen] = useState(false);
  const [compareData, setCompareData] = useState<{
    originalSession: Session;
    replaySession: Session;
  } | null>(null);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [lastSessionCheck, setLastSessionCheck] = useState<string | null>(null);

  // Load sessions data
  useEffect(() => {
    const loadSessionsData = async () => {
      try {
        // First try to load from API (real session data)
        try {
          const response = await fetch('http://localhost:3001/api/sessions');
          if (response.ok) {
            const apiSessions = await response.json();
            console.log('Loaded sessions from API:', apiSessions);
            
            // Convert API format to SessionSummary format
            const sessionSummaries = apiSessions.map((session: any) => ({
              sessionId: session.id,
              title: session.title || `Session ${session.id.substring(0, 8)}`,
              createdAt: session.timestamp,
              stepCount: session.stepCount || 0,
              lastActivity: session.modified,
              tags: session.tags || [],
              replayOf: undefined,
              replayFromStepIndex: undefined,
              isReplaySession: false,
            }));
            
            setSessions(sessionSummaries);
            
            // Auto-select most recent session if available
            if (sessionSummaries.length > 0) {
              console.log('Auto-selecting latest session:', sessionSummaries[0].sessionId);
              // Don't auto-select immediately, let user choose
            }
            return;
          }
        } catch (apiError) {
          console.warn('API not available, falling back to local files:', apiError);
        }
        
        // Fallback to local session files
        const sessionFiles = ['session1.json', 'session2.json', 'session3.json'];
        const sessionPromises = sessionFiles.map(async (filename) => {
          try {
            const response = await fetch(`/data/${filename}`);
            
            if (!response.ok) {
              console.warn(`Failed to fetch ${filename}: ${response.status}`);
              return null;
            }
            
            const sessionData: Session = await response.json();
            
            // Validate session data structure
            if (!sessionData || !sessionData.steps || !Array.isArray(sessionData.steps)) {
              console.warn(`Invalid session data structure in ${filename}`);
              return null;
            }
            
            // Convert to SessionSummary
            const allTags = sessionData.steps.flatMap(step => step.tags || []);
            const uniqueTags = Array.from(new Set(allTags));
            
            return {
              sessionId: sessionData.sessionId,
              title: sessionData.title,
              createdAt: sessionData.createdAt,
              stepCount: sessionData.steps.length,
              lastActivity: sessionData.steps[sessionData.steps.length - 1]?.timestamp || sessionData.createdAt,
              tags: uniqueTags,
              replayOf: sessionData.replayOf,
              replayFromStepIndex: sessionData.replayFromStepIndex,
              isReplaySession: sessionData.isReplaySession,
            };
          } catch (error) {
            console.warn(`Error loading ${filename}:`, error);
            return null;
          }
        });

        const sessionSummaries = await Promise.all(sessionPromises);
        // Filter out null values from failed loads
        const validSessions = sessionSummaries.filter(session => session !== null);
        setSessions(validSessions);
        
        // Also store full session data for replay functionality
        const fullSessionPromises = sessionFiles.map(async (filename) => {
          try {
            const response = await fetch(`/data/${filename}`);
            if (!response.ok) return null;
            return await response.json();
          } catch (error) {
            console.warn(`Error loading full session ${filename}:`, error);
            return null;
          }
        });
        
        const fullSessions = await Promise.all(fullSessionPromises);
        const validFullSessions = fullSessions.filter(session => session !== null);
        setAllSessions(validFullSessions);
      } catch (error) {
        console.error("Error loading sessions data:", error);
      }
    };

    loadSessionsData();
  }, []);

  // Real-time updates - simple step count checking
  useEffect(() => {
    if (!isLiveMode || !currentSession) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/session/${currentSession.sessionId}`);
        if (response.ok) {
          const apiData = await response.json();
          const sessionData = apiData.data;
          
          if (sessionData && sessionData.steps && sessionData.steps.length !== currentSession.steps.length) {
            console.log(`Step count changed: ${currentSession.steps.length} → ${sessionData.steps.length}`);
            setCurrentSession(sessionData);
          }
        }
      } catch (error) {
        console.error('Live update failed:', error);
      }
    }, 1000); // Check every 1 second

    return () => clearInterval(pollInterval);
  }, [isLiveMode, currentSession]);

  // Handle session selection
  const handleSessionSelect = useCallback(async (sessionId: string) => {
    try {
      // First check if it's a replay session already in memory
      const replaySession = allSessions.find(s => s.sessionId === sessionId);
      if (replaySession) {
        setCurrentSession(replaySession);
        setView('workflow');
        
        // Auto-select first step if available
        if (replaySession.steps.length > 0) {
          setSelectedStep(replaySession.steps[0].stepIndex);
        }
        return;
      }
      
      // Try to load from API first
      try {
        const response = await fetch(`http://localhost:3001/api/session/${sessionId}`);
        if (response.ok) {
          const apiData = await response.json();
          console.log('Loaded session from API:', apiData);
          
          const sessionData: Session = apiData.data;
          
          // Validate session data structure
          if (!sessionData || !sessionData.steps || !Array.isArray(sessionData.steps)) {
            throw new Error('Invalid session data structure from API');
          }
          
          setCurrentSession(sessionData);
          setView('workflow');
          
          // Auto-select first step if available
          if (sessionData.steps.length > 0) {
            setSelectedStep(sessionData.steps[0].stepIndex);
          }
          return;
        }
      } catch (apiError) {
        console.warn('API not available, falling back to local files:', apiError);
      }
      
      // Fallback to local files for demo sessions
      const filename = sessionId === 'sess-20250718-001' ? 'session1.json' : 
                      sessionId === 'sess-20250718-002' ? 'session2.json' : 'session3.json';
      const response = await fetch(`/data/${filename}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.status}`);
      }
      
      const sessionData: Session = await response.json();
      
      // Validate session data structure
      if (!sessionData || !sessionData.steps || !Array.isArray(sessionData.steps)) {
        throw new Error('Invalid session data structure');
      }
      
      setCurrentSession(sessionData);
      setView('workflow');
      
      // Auto-select first step if available
      if (sessionData.steps.length > 0) {
        setSelectedStep(sessionData.steps[0].stepIndex);
      }
    } catch (error) {
      console.error("Error loading session:", error);
      message.error("Failed to load session data");
    }
  }, [allSessions]);

  // Handle step selection
  const handleStepSelect = (stepIndex: number) => {
    setSelectedStep(stepIndex);
    setDrawerOpen(true);
  };

  // Handle drawer close
  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  // Get selected step data
  const selectedStepData = currentSession?.steps.find((step) => step.stepIndex === selectedStep) || null;

  // Mock LLM API call for replay
  const mockLLMCall = async (prompt: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response - in real implementation, this would call Claude API or OpenAI
    const responses = [
      "```typescript\n// Re-generated response\ninterface ReplayExample {\n  id: string;\n  data: any;\n}\n```",
      "재생성된 응답입니다. 이것은 모의 LLM 호출 결과입니다.",
      "# 재실행 결과\n\n이 응답은 원본 프롬프트를 다시 실행한 결과입니다.\n\n- 타임스탬프: " + new Date().toISOString(),
      "Re-executed prompt result. This is a mock response generated at " + new Date().toLocaleString(),
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };


  // Handle workflow replay from specific step
  const handleReplayFromHere = async (fromStep: Step) => {
    if (!currentSession) return;

    try {
      // Create new replay session from this step
      const replaySession = await createReplaySession(
        currentSession,
        fromStep.stepIndex,
        mockExecuteStep
      );

      // Add to sessions list
      const newSessionSummary: SessionSummary = {
        sessionId: replaySession.sessionId,
        title: replaySession.title,
        createdAt: replaySession.createdAt,
        stepCount: replaySession.steps.length,
        lastActivity: replaySession.steps[replaySession.steps.length - 1]?.timestamp || replaySession.createdAt,
        tags: Array.from(new Set(replaySession.steps.flatMap(step => step.tags || []))),
        replayOf: replaySession.replayOf,
        replayFromStepIndex: replaySession.replayFromStepIndex,
        isReplaySession: replaySession.isReplaySession,
      };

      setSessions(prev => [...prev, newSessionSummary]);
      setAllSessions(prev => [...prev, replaySession]);
      
      // Switch to the new replay session
      setCurrentSession(replaySession);
      setSelectedStep(replaySession.steps[0]?.stepIndex || null);
      
    } catch (error) {
      console.error('Failed to replay workflow:', error);
    }
  };

  // Handle session comparison
  const handleCompareSession = (originalSessionId: string, replaySessionId: string) => {
    const originalSession = allSessions.find(s => s.sessionId === originalSessionId);
    const replaySession = allSessions.find(s => s.sessionId === replaySessionId);
    
    if (originalSession && replaySession) {
      setCompareData({ originalSession, replaySession });
      setView('compare');
    }
  };

  // Dark mode toggle
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Back to sessions
  const handleBackToSessions = () => {
    setView('sessions');
    setCurrentSession(null);
    setSelectedStep(null);
    setDrawerOpen(false);
    setCompareData(null);
  };

  // Close comparison view
  const handleCloseComparison = () => {
    setView('sessions');
    setCompareData(null);
  };

  // Handle response panel
  const handleOpenResponsePanel = () => {
    setResponsePanelOpen(true);
  };

  const handleCloseResponsePanel = () => {
    setResponsePanelOpen(false);
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
      message.error("Failed to copy to clipboard");
    }
  };

  // Sessions view
  if (view === 'sessions') {
    return (
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <Layout style={{ height: "100vh", overflow: "hidden" }} data-theme={isDarkMode ? "dark" : "light"}>
          <Header
            style={{
              background: isDarkMode ? "#1f1f1f" : "#fff",
              borderBottom: `1px solid ${isDarkMode ? "#434343" : "#d9d9d9"}`,
              padding: "16px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "auto",
              minHeight: "80px",
              lineHeight: "normal",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Avatar
                size="large"
                icon={<CodeOutlined />}
                style={{ backgroundColor: "#1890ff" }}
              />
              <div>
                <Title
                  level={3}
                  style={{
                    margin: 0,
                    color: isDarkMode ? "#fff" : "#000",
                  }}
                >
                  LLM Workflow Visualizer
                </Title>
                <Text type="secondary">
                  <Badge count={sessions.length} showZero color="#52c41a" />{" "}
                  sessions available
                </Text>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>
                  Live Mode
                </Text>
                <Switch
                  checked={isLiveMode}
                  onChange={setIsLiveMode}
                  checkedChildren={<PlayCircleOutlined />}
                  unCheckedChildren={<PauseCircleOutlined />}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>
                  {isDarkMode ? "Dark" : "Light"}
                </Text>
                <Switch
                  checked={isDarkMode}
                  onChange={toggleDarkMode}
                  checkedChildren={<BulbFilled />}
                  unCheckedChildren={<BulbOutlined />}
                />
              </div>
            </div>
          </Header>

          <Content>
            <SessionList
              sessions={sessions}
              onSessionSelect={handleSessionSelect}
              onCompareSession={handleCompareSession}
              isDarkMode={isDarkMode}
            />
          </Content>
        </Layout>
      </ConfigProvider>
    );
  }

  // Compare view
  if (view === 'compare' && compareData) {
    return (
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 6,
          },
        }}
      >
        <Layout style={{ height: "100vh", overflow: "hidden" }} data-theme={isDarkMode ? "dark" : "light"}>
          <SessionCompareView
            originalSession={compareData.originalSession}
            replaySession={compareData.replaySession}
            isDarkMode={isDarkMode}
            onClose={handleCloseComparison}
          />
        </Layout>
      </ConfigProvider>
    );
  }

  // Workflow view
  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <Layout style={{ height: "100vh", overflow: "hidden" }} data-theme={isDarkMode ? "dark" : "light"}>
        <Header
          style={{
            background: isDarkMode ? "#1f1f1f" : "#fff",
            borderBottom: `1px solid ${isDarkMode ? "#434343" : "#d9d9d9"}`,
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "auto",
            minHeight: "80px",
            lineHeight: "normal",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToSessions}
              style={{ color: isDarkMode ? "#fff" : "#000" }}
            >
              Back to Sessions
            </Button>
            <div>
              <Title
                level={4}
                style={{
                  margin: 0,
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                {currentSession?.title || "Workflow"}
              </Title>
              <Text type="secondary">
                <Badge count={currentSession?.steps.length || 0} showZero color="#52c41a" />{" "}
                steps • {currentSession?.sessionId}
              </Text>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Button
              type="text"
              icon={<RobotOutlined />}
              onClick={handleOpenResponsePanel}
              style={{ color: isDarkMode ? "#fff" : "#000" }}
            >
              AI Responses
            </Button>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>
                  Live Mode {isLiveMode && <Badge status="processing" />}
                </Text>
                <Switch
                  checked={isLiveMode}
                  onChange={setIsLiveMode}
                  checkedChildren={<PlayCircleOutlined />}
                  unCheckedChildren={<PauseCircleOutlined />}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>
                  {isDarkMode ? "Dark" : "Light"}
                </Text>
                <Switch
                  checked={isDarkMode}
                  onChange={toggleDarkMode}
                  checkedChildren={<BulbFilled />}
                  unCheckedChildren={<BulbOutlined />}
                />
              </div>
            </div>
          </div>
        </Header>

        <Layout style={{ height: "calc(100vh - 80px)", overflow: "hidden" }}>
          {/* Left Sidebar - Step List */}
          <Sider
            width={320}
            style={{
              background: isDarkMode ? "#141414" : "#fafafa",
              borderRight: `1px solid ${isDarkMode ? "#434343" : "#d9d9d9"}`,
              height: "100%",
              overflow: "hidden",
            }}
          >
            <StepList
              steps={currentSession?.steps || []}
              selectedStep={selectedStep}
              onStepSelect={handleStepSelect}
              isDarkMode={isDarkMode}
            />
          </Sider>

          {/* Center - Flow Visualization (Full Width) */}
          <Content
            style={{
              background: isDarkMode ? "#0f0f0f" : "#f5f5f5",
              margin: 0,
              padding: 0,
              height: "100%",
              overflow: "hidden",
            }}
          >
            <FlowVisualization
              steps={currentSession?.steps || []}
              selectedStep={selectedStep}
              onStepSelect={handleStepSelect}
              isDarkMode={isDarkMode}
            />
          </Content>
        </Layout>

        {/* Step Detail Drawer */}
        <StepDrawer
          open={drawerOpen}
          onClose={handleDrawerClose}
          step={selectedStepData}
          steps={currentSession?.steps || []}
          isDarkMode={isDarkMode}
          onReplayFromHere={handleReplayFromHere}
          onStepSelect={handleStepSelect}
        />

        {/* Response Panel */}
        <ResponsePanel
          visible={responsePanelOpen}
          onClose={handleCloseResponsePanel}
          allSteps={currentSession?.steps || []}
          isDarkMode={isDarkMode}
          onCopy={copyToClipboard}
        />
      </Layout>
    </ConfigProvider>
  );
}

export default App;
