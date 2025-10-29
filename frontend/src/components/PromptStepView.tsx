import React, { useMemo } from 'react';
import { Card, Typography, Space, Statistic, Button, Divider, Row, Col, Tabs, Empty, Tag } from 'antd';
import { CopyOutlined, MessageOutlined, RobotOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { PromptStep, AssistantResponseStep, Step } from '../types/index';

const { Text, Paragraph } = Typography;

interface PromptStepViewProps {
  step: PromptStep;
  isDarkMode: boolean;
  onCopy: (text: string) => void;
  allSteps?: Step[];
}

const PromptStepView: React.FC<PromptStepViewProps> = ({ step, isDarkMode, onCopy, allSteps = [] }) => {
  const promptLength = step.data.prompt.length;
  
  // Find related assistant response in the same group
  const relatedResponse = useMemo(() => {
    return allSteps.find(s => 
      s.type === 'assistant_response' && 
      s.group === step.group
    ) as AssistantResponseStep | undefined;
  }, [allSteps, step.group]);
  
  const responseLength = relatedResponse?.data.response.length || 0;
  const estimatedTokens = Math.ceil((promptLength + responseLength) / 4);
  const estimatedCost = (estimatedTokens * 0.002 / 1000);

  return (
    <div style={{ padding: "24px 32px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Metrics */}
        <Card
          title="Prompt Metrics"
          size="small"
          style={{ backgroundColor: isDarkMode ? "#1f1f1f" : "#fff" }}
        >
          <Row gutter={24}>
            <Col span={6}>
              <Statistic
                title="Prompt Length"
                value={promptLength}
                suffix="chars"
                valueStyle={{ fontSize: "16px" }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Response Length"
                value={responseLength}
                suffix="chars"
                valueStyle={{ fontSize: "16px" }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Est. Tokens"
                value={estimatedTokens}
                valueStyle={{ fontSize: "16px" }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Est. Cost"
                value={estimatedCost.toFixed(4)}
                prefix="$"
                valueStyle={{ fontSize: "16px" }}
              />
            </Col>
          </Row>
        </Card>

        {/* Prompt Input and Response */}
        <Card
          title={
            <Space>
              <MessageOutlined style={{ color: "#1890ff" }} />
              <Text strong>Prompt & Response</Text>
            </Space>
          }
          style={{ backgroundColor: isDarkMode ? "#1f1f1f" : "#fff" }}
        >
          <Tabs
            defaultActiveKey="prompt"
            items={[
              {
                key: "prompt",
                label: (
                  <Space>
                    <MessageOutlined />
                    <span>Prompt</span>
                    <Tag color="blue">{promptLength} chars</Tag>
                  </Space>
                ),
                children: (
                  <div>
                    <div style={{ marginBottom: "12px", textAlign: "right" }}>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => onCopy(step.data.prompt)}
                      >
                        Copy Prompt
                      </Button>
                    </div>
                    <div
                      style={{
                        backgroundColor: isDarkMode ? "#262626" : "#f5f5f5",
                        border: `1px solid ${isDarkMode ? "#434343" : "#e5e5e5"}`,
                        borderRadius: "6px",
                        overflow: "hidden",
                        height: "400px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <Paragraph
                        copyable={false}
                        style={{
                          margin: 0,
                          padding: "12px",
                          fontFamily: "monospace",
                          fontSize: "13px",
                          lineHeight: "1.5",
                          overflow: "auto",
                          whiteSpace: "pre-wrap",
                          color: isDarkMode ? "#e5e5e5" : "#333",
                          flex: 1,
                        }}
                        className="custom-scroll"
                      >
                        {step.data.prompt}
                      </Paragraph>
                    </div>
                  </div>
                ),
              },
              {
                key: "response",
                label: (
                  <Space>
                    <RobotOutlined />
                    <span>Response</span>
                    {relatedResponse ? (
                      <Tag color="green">{responseLength} chars</Tag>
                    ) : (
                      <Tag color="orange" icon={<ExclamationCircleOutlined />}>No response</Tag>
                    )}
                  </Space>
                ),
                children: relatedResponse ? (
                  <div>
                    <div style={{ marginBottom: "12px", textAlign: "right" }}>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => onCopy(relatedResponse.data.response)}
                      >
                        Copy Response
                      </Button>
                    </div>
                    <div
                      style={{
                        backgroundColor: isDarkMode ? "#262626" : "#f5f5f5",
                        border: `1px solid ${isDarkMode ? "#434343" : "#e5e5e5"}`,
                        borderRadius: "6px",
                        overflow: "hidden",
                        height: "400px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        style={{
                          overflow: "auto",
                          display: "flex",
                          flex: 1,
                        }}
                        className="custom-scroll"
                      >
                        <div
                          style={{
                            width: "50px",
                            backgroundColor: isDarkMode ? "#1a1a1a" : "#f0f0f0",
                            borderRight: `1px solid ${isDarkMode ? "#434343" : "#e5e5e5"}`,
                            fontSize: "12px",
                            fontFamily: "monospace",
                            color: isDarkMode ? "#666" : "#999",
                            textAlign: "right",
                            userSelect: "none",
                            flexShrink: 0,
                          }}
                        >
                          {relatedResponse.data.response.split('\n').map((_, index) => (
                            <div
                              key={index}
                              style={{
                                padding: "0 8px",
                                lineHeight: "1.5",
                                fontSize: "13px",
                                minHeight: "19.5px",
                              }}
                            >
                              {index + 1}
                            </div>
                          ))}
                        </div>
                        
                        <Paragraph
                          copyable={false}
                          style={{
                            margin: 0,
                            padding: "12px",
                            fontFamily: "monospace",
                            fontSize: "13px",
                            lineHeight: "1.5",
                            whiteSpace: "pre-wrap",
                            color: isDarkMode ? "#e5e5e5" : "#333",
                            flex: 1,
                          }}
                        >
                          {relatedResponse.data.response}
                        </Paragraph>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No response found for this prompt"
                  >
                    <Text type="secondary">
                      This prompt doesn't have a corresponding response in group {step.group}
                    </Text>
                  </Empty>
                ),
              },
            ]}
          />
        </Card>
      </Space>
    </div>
  );
};

export default PromptStepView;