import React, { useState, useMemo } from "react";
import {
  Typography,
  Space,
  Button,
  Card,
  Tag,
  Divider,
  Collapse,
  message,
  Tooltip,
  Avatar,
} from "antd";
import {
  CopyOutlined,
  ReloadOutlined,
  MessageOutlined,
  ExpandAltOutlined,
  CompressOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  TagOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Step, AssistantResponseStep, PromptStep } from "../types/index";

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface AssistantResponseViewProps {
  step: AssistantResponseStep;
  isDarkMode: boolean;
  onCopy: (text: string) => Promise<void>;
  allSteps: Step[];
  onStepSelect?: (stepIndex: number) => void;
  onRerunRequest?: (originalPrompt: string) => Promise<void>;
}

const AssistantResponseView: React.FC<AssistantResponseViewProps> = ({
  step,
  isDarkMode,
  onCopy,
  allSteps,
  onStepSelect,
  onRerunRequest,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRerunning, setIsRerunning] = useState(false);

  // Find related prompt step in the same group
  const relatedPrompt = useMemo(() => {
    return allSteps.find(
      (s): s is PromptStep => 
        s.type === 'prompt' && 
        s.group === step.group
    ) || null;
  }, [allSteps, step.group]);

  // Handle copy entire response
  const handleCopyResponse = async () => {
    await onCopy(step.data.response);
  };

  // Handle copy code block
  const handleCopyCode = async (code: string) => {
    await onCopy(code);
    message.success("Code copied to clipboard!");
  };

  // Handle rerun request
  const handleRerunRequest = async () => {
    if (!relatedPrompt || !onRerunRequest) return;
    
    setIsRerunning(true);
    try {
      await onRerunRequest(relatedPrompt.data.prompt);
      message.success("Request sent for re-execution!");
    } catch (error) {
      message.error("Failed to rerun request");
    } finally {
      setIsRerunning(false);
    }
  };

  // Handle navigation to related prompt
  const handleGoToPrompt = () => {
    if (relatedPrompt && onStepSelect) {
      onStepSelect(relatedPrompt.stepIndex);
    }
  };

  // Check if response is long (for expand/collapse)
  const isLongResponse = step.data.response.length > 1000;
  const shouldTruncate = isLongResponse && !isExpanded;
  const displayResponse = shouldTruncate 
    ? step.data.response.substring(0, 1000) + "..."
    : step.data.response;

  // Custom components for markdown rendering
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (!inline && language) {
        return (
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px 12px',
              background: isDarkMode ? '#2d2d2d' : '#f6f8fa',
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px',
              borderBottom: `1px solid ${isDarkMode ? '#444' : '#d1d9e0'}`,
            }}>
              <Text 
                type="secondary" 
                style={{ fontSize: '12px', fontFamily: 'monospace' }}
              >
                {language}
              </Text>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopyCode(String(children).replace(/\n$/, ''))}
                style={{ padding: '4px 8px' }}
              >
                Copy
              </Button>
            </div>
            <SyntaxHighlighter
              style={isDarkMode ? oneDark : oneLight}
              language={language}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: '6px',
                borderBottomRightRadius: '6px',
              }}
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          </div>
        );
      }
      
      return (
        <code 
          className={className} 
          style={{ 
            background: isDarkMode ? '#2d2d2d' : '#f6f8fa',
            padding: '2px 4px',
            borderRadius: '3px',
            fontSize: '13px',
            fontFamily: 'monospace'
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        style={{
          background: isDarkMode ? "#1a2b3d" : "#e6f3ff",
          borderBottom: `1px solid ${isDarkMode ? "#2d4a66" : "#91caff"}`,
          padding: "20px 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
          <Avatar
            size="large"
            icon={<RobotOutlined />}
            style={{ 
              backgroundColor: "#1890ff",
              border: `2px solid ${isDarkMode ? "#2d4a66" : "#91caff"}`
            }}
          />
          <div style={{ flex: 1 }}>
            <Title
              level={4}
              style={{
                margin: 0,
                color: isDarkMode ? "#ffffff" : "#002766",
                fontFamily: "system-ui, -apple-system, sans-serif",
              }}
            >
              💬 Claude의 응답
            </Title>
            <Space size="middle" style={{ marginTop: "4px" }}>
              <Text
                type="secondary"
                style={{ 
                  fontSize: "13px",
                  color: isDarkMode ? "#8fb8d4" : "#4a6b85"
                }}
              >
                <ClockCircleOutlined style={{ marginRight: "4px" }} />
                {new Date(step.timestamp).toLocaleString()}
              </Text>
              <Text
                type="secondary"
                style={{ 
                  fontSize: "13px",
                  color: isDarkMode ? "#8fb8d4" : "#4a6b85"
                }}
              >
                Step {step.stepIndex}
              </Text>
            </Space>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px" }} className="custom-scroll">
        {/* Response Content */}
        <Card
          style={{
            backgroundColor: isDarkMode ? "#1a1a1a" : "#fafbfc",
            borderColor: isDarkMode ? "#2d2d2d" : "#e1e4e8",
            marginBottom: "24px",
          }}
          bodyStyle={{ padding: "24px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <Text strong style={{ fontSize: "16px", color: isDarkMode ? "#fff" : "#24292e" }}>
              Response Content
            </Text>
            <Space>
              {isLongResponse && (
                <Button
                  type="text"
                  size="small"
                  icon={isExpanded ? <CompressOutlined /> : <ExpandAltOutlined />}
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? "접기" : "전체 보기"}
                </Button>
              )}
              <Button
                type="primary"
                size="small"
                icon={<CopyOutlined />}
                onClick={handleCopyResponse}
              >
                복사
              </Button>
            </Space>
          </div>
          
          <div
            style={{
              fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
              lineHeight: "1.6",
              color: isDarkMode ? "#e1e4e8" : "#24292e",
            }}
          >
            <ReactMarkdown components={markdownComponents}>
              {displayResponse}
            </ReactMarkdown>
          </div>
          
          {shouldTruncate && (
            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <Button
                type="link"
                onClick={() => setIsExpanded(true)}
                style={{ padding: 0 }}
              >
                더 보기... ({step.data.response.length - 1000}자 더)
              </Button>
            </div>
          )}
        </Card>

        {/* Action Buttons */}
        <Card
          style={{
            backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
            borderColor: isDarkMode ? "#2d2d2d" : "#e1e4e8",
            marginBottom: "24px",
          }}
          bodyStyle={{ padding: "20px" }}
        >
          <Text strong style={{ fontSize: "14px", color: isDarkMode ? "#fff" : "#24292e", marginBottom: "16px", display: "block" }}>
            Actions
          </Text>
          <Space wrap>
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopyResponse}
              size="large"
            >
              📋 전체 복사
            </Button>
            {onRerunRequest && relatedPrompt && (
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRerunRequest}
                loading={isRerunning}
                size="large"
              >
                🔄 새로 실행
              </Button>
            )}
            <Button
              icon={<MessageOutlined />}
              onClick={() => message.info("피드백 기능은 준비 중입니다.")}
              size="large"
            >
              📝 피드백 보내기
            </Button>
          </Space>
        </Card>

        {/* Side Information */}
        <Collapse
          defaultActiveKey={["1", "2"]}
          style={{
            backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
            borderColor: isDarkMode ? "#2d2d2d" : "#e1e4e8",
          }}
        >
          {/* Related Prompt */}
          {relatedPrompt && (
            <Panel
              header={
                <Text strong style={{ color: isDarkMode ? "#fff" : "#24292e" }}>
                  🔗 연결된 프롬프트
                </Text>
              }
              key="1"
            >
              <Card
                size="small"
                style={{
                  backgroundColor: isDarkMode ? "#0f0f0f" : "#f6f8fa",
                  borderColor: isDarkMode ? "#2d2d2d" : "#e1e4e8",
                  cursor: onStepSelect ? "pointer" : "default",
                }}
                onClick={onStepSelect ? handleGoToPrompt : undefined}
                bodyStyle={{ padding: "12px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <Text strong style={{ fontSize: "13px", color: isDarkMode ? "#fff" : "#24292e" }}>
                      Step {relatedPrompt.stepIndex}: {relatedPrompt.title || "Prompt"}
                    </Text>
                    <Paragraph
                      ellipsis={{ rows: 2, expandable: false }}
                      style={{ 
                        margin: "8px 0 0 0", 
                        fontSize: "12px",
                        color: isDarkMode ? "#8b949e" : "#656d76"
                      }}
                    >
                      {relatedPrompt.data.prompt}
                    </Paragraph>
                  </div>
                  {onStepSelect && (
                    <Tooltip title="프롬프트로 이동">
                      <Button
                        type="text"
                        size="small"
                        icon={<LinkOutlined />}
                        style={{ marginLeft: "8px" }}
                      />
                    </Tooltip>
                  )}
                </div>
              </Card>
            </Panel>
          )}

          {/* Tags and Metadata */}
          <Panel
            header={
              <Text strong style={{ color: isDarkMode ? "#fff" : "#24292e" }}>
                📋 메타데이터
              </Text>
            }
            key="2"
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {/* Tags */}
              {step.tags && step.tags.length > 0 && (
                <div>
                  <Text strong style={{ fontSize: "13px", color: isDarkMode ? "#fff" : "#24292e" }}>
                    <TagOutlined style={{ marginRight: "4px" }} />
                    Tags
                  </Text>
                  <div style={{ marginTop: "8px" }}>
                    <Space wrap>
                      {step.tags.map((tag) => (
                        <Tag key={tag} color="orange" style={{ fontSize: "11px" }}>
                          {tag}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </div>
              )}

              {/* Group and Session Info */}
              <div>
                <Text strong style={{ fontSize: "13px", color: isDarkMode ? "#fff" : "#24292e" }}>
                  📁 Session Info
                </Text>
                <div style={{ marginTop: "8px" }}>
                  <Space direction="vertical" size="small">
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Group: {step.group}
                    </Text>
                    <Text type="secondary" style={{ fontSize: "12px" }}>
                      Timestamp: {step.timestamp}
                    </Text>
                  </Space>
                </div>
              </div>
            </Space>
          </Panel>
        </Collapse>
      </div>
    </div>
  );
};

export default AssistantResponseView;