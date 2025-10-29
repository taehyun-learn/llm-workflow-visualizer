import React from 'react';
import { Typography, Tag, Space, Descriptions } from 'antd';
import { 
  MessageOutlined, 
  EditOutlined, 
  CodeOutlined, 
  InfoCircleOutlined,
  HistoryOutlined 
} from '@ant-design/icons';
import type { Step } from '../types/index';

const { Title, Text } = Typography;

interface StepDetailHeaderProps {
  step: Step;
  isDarkMode: boolean;
  steps?: Step[];
}

const StepDetailHeader: React.FC<StepDetailHeaderProps> = ({ step, isDarkMode, steps = [] }) => {
  const getStepIcon = (type: Step["type"]) => {
    switch (type) {
      case "prompt":
        return <MessageOutlined />;
      case "file_edit":
        return <EditOutlined />;
      case "command":
        return <CodeOutlined />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const getStepColor = (type: Step["type"]) => {
    switch (type) {
      case "prompt":
        return "#1890ff";
      case "file_edit":
        return "#52c41a";
      case "command":
        return "#722ed1";
      default:
        return "#8c8c8c";
    }
  };

  const getTagColor = (type: Step["type"]) => {
    switch (type) {
      case "prompt":
        return "blue";
      case "file_edit":
        return "green";
      case "command":
        return "purple";
      default:
        return "default";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const isReplayedStep = step?.replayOf !== undefined;
  const hasReplayedVersions = steps.some(s => s.replayOf === step?.stepIndex);

  const headerStyle = {
    background: isDarkMode ? "#1f1f1f" : "#fafafa",
    borderBottom: `1px solid ${isDarkMode ? "#434343" : "#d9d9d9"}`,
    padding: "16px",
  };

  return (
    <div style={{ ...headerStyle, padding: "24px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        {/* Left side - Main info */}
        <Space align="center" size="large">
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: getStepColor(step.type),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: "24px",
            }}
          >
            {getStepIcon(step.type)}
          </div>
          <div>
            <Title
              level={3}
              style={{ margin: 0, color: isDarkMode ? "#fff" : "#000" }}
            >
              Step {step.stepIndex}
            </Title>
            {step.title && (
              <Title
                level={5}
                style={{ margin: "4px 0 8px 0", color: isDarkMode ? "#e5e5e5" : "#666", fontWeight: 400 }}
              >
                {step.title}
              </Title>
            )}
            <Space size={8}>
              <Tag color={getTagColor(step.type)} style={{ fontSize: "12px", padding: "4px 8px" }}>
                {step.type.toUpperCase()}
              </Tag>
              {isReplayedStep && (
                <Tag color="orange" icon={<HistoryOutlined />} style={{ fontSize: "12px", padding: "4px 8px" }}>
                  Replay of Step {step.replayOf}
                </Tag>
              )}
            </Space>
          </div>
        </Space>

        {/* Right side - Timestamp */}
        <div style={{ textAlign: "right" }}>
          <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
            Executed at
          </Text>
          <Text code style={{ fontSize: "13px" }}>
            {formatTimestamp(step.timestamp)}
          </Text>
        </div>
      </div>

      {/* Tags and Additional Info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          {step.tags && step.tags.length > 0 && (
            <Space size={6}>
              <Text type="secondary" style={{ fontSize: "12px" }}>Tags:</Text>
              {step.tags.map((tag, index) => (
                <Tag key={index} size="small" style={{ margin: "0 2px" }}>{tag}</Tag>
              ))}
            </Space>
          )}
        </div>
        
        <div>
          {hasReplayedVersions && (
            <Space size={6}>
              <Text type="secondary" style={{ fontSize: "12px" }}>Replayed versions:</Text>
              {steps
                .filter(s => s.replayOf === step.stepIndex)
                .map(s => (
                  <Tag key={s.stepIndex} color="cyan" size="small">
                    Step {s.stepIndex}
                  </Tag>
                ))}
            </Space>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepDetailHeader;