import React from 'react';
import { Card, Typography, Space, Tag, Button, Row, Col, Statistic, Alert, Tabs } from 'antd';
import { 
  CopyOutlined, 
  CodeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ConsoleSqlOutlined
} from '@ant-design/icons';
import type { CommandStep } from '../types/index';

const { Text, Paragraph } = Typography;

interface CommandStepViewProps {
  step: CommandStep;
  isDarkMode: boolean;
  onCopy: (text: string) => void;
}

const CommandStepView: React.FC<CommandStepViewProps> = ({ step, isDarkMode, onCopy }) => {
  const isSuccessful = step.data.exitCode === 0;
  const hasOutput = step.data.stdout && step.data.stdout.trim().length > 0;
  const hasErrors = step.data.stderr && step.data.stderr.trim().length > 0;

  const getStatusIcon = () => {
    if (isSuccessful) {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    } else {
      return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    }
  };

  const getStatusColor = () => {
    return isSuccessful ? 'success' : 'error';
  };

  const commandStats = {
    outputLines: hasOutput ? step.data.stdout.split('\n').length : 0,
    errorLines: hasErrors ? step.data.stderr.split('\n').length : 0,
    outputSize: hasOutput ? new Blob([step.data.stdout]).size : 0,
    errorSize: hasErrors ? new Blob([step.data.stderr]).size : 0,
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderOutputSection = (
    title: string,
    content: string,
    type: 'stdout' | 'stderr',
    icon: React.ReactNode
  ) => {
    if (!content || content.trim().length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: isDarkMode ? '#8c8c8c' : '#999' }}>
          <Text type="secondary">No {type} output</Text>
        </div>
      );
    }

    const lines = content.split('\n');
    const isError = type === 'stderr';

    return (
      <div>
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: isDarkMode ? "#1a1a1a" : "#fafafa",
            borderBottom: `1px solid ${isDarkMode ? "#434343" : "#e5e5e5"}`,
            fontSize: "12px",
            color: isDarkMode ? "#8c8c8c" : "#666",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Space>
            {icon}
            <span>{title} • {lines.length} lines • {formatSize(new Blob([content]).size)}</span>
          </Space>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => onCopy(content)}
          >
            Copy
          </Button>
        </div>
        <div
          style={{
            height: "400px",
            overflow: "auto",
            backgroundColor: isError 
              ? (isDarkMode ? "#2a1517" : "#fff1f0")
              : (isDarkMode ? "#1a1a1a" : "#fafafa"),
            display: "flex",
          }}
          className="custom-scroll"
        >
          {/* Line numbers */}
          <div
            style={{
              width: "40px",
              backgroundColor: isError 
                ? (isDarkMode ? "#4c1d1d" : "#ffebee")
                : (isDarkMode ? "#262626" : "#f0f0f0"),
              borderRight: `1px solid ${isDarkMode ? "#434343" : "#e5e5e5"}`,
              fontSize: "11px",
              fontFamily: "monospace",
              color: isDarkMode ? "#666" : "#999",
              textAlign: "right",
              userSelect: "none",
              flexShrink: 0,
            }}
          >
            {lines.map((_, index) => (
              <div
                key={index}
                style={{
                  padding: "0 6px",
                  lineHeight: "1.4",
                  fontSize: "12px",
                  minHeight: "16.8px",
                }}
              >
                {index + 1}
              </div>
            ))}
          </div>
          
          {/* Content */}
          <Paragraph
            copyable={false}
            style={{
              margin: 0,
              padding: "12px",
              fontFamily: "monospace",
              fontSize: "12px",
              lineHeight: "1.4",
              whiteSpace: "pre-wrap",
              color: isError 
                ? (isDarkMode ? "#ff7875" : "#cf1322")
                : (isDarkMode ? "#e5e5e5" : "#333"),
              flex: 1,
            }}
          >
            {content}
          </Paragraph>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "24px 32px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Command Info */}
        <Row gutter={24}>
          {/* Left side - Command */}
          <Col span={16}>
            <Card
              title={
                <Space>
                  <CodeOutlined style={{ color: "#722ed1" }} />
                  <Text strong>Command Execution</Text>
                </Space>
              }
              size="small"
              style={{ backgroundColor: isDarkMode ? "#1f1f1f" : "#fff" }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {/* Command */}
                <div>
                  <Text strong style={{ color: isDarkMode ? "#fff" : "#000", fontSize: "14px" }}>Command:</Text>
                  <div
                    style={{
                      marginTop: "8px",
                      padding: "16px",
                      backgroundColor: isDarkMode ? "#262626" : "#f5f5f5",
                      border: `1px solid ${isDarkMode ? "#434343" : "#e5e5e5"}`,
                      borderRadius: "6px",
                      fontFamily: "monospace",
                      fontSize: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text code style={{ flex: 1, color: isDarkMode ? "#e5e5e5" : "#333", fontSize: "14px" }}>
                      {step.data.command}
                    </Text>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => onCopy(step.data.command)}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Status & Stats */}
                <Space size="large">
                  <Tag color={getStatusColor()} icon={getStatusIcon()} style={{ fontSize: "12px", padding: "4px 8px" }}>
                    Exit Code: {step.data.exitCode}
                  </Tag>
                  <Tag color={isSuccessful ? "success" : "error"} style={{ fontSize: "12px", padding: "4px 8px" }}>
                    {isSuccessful ? "SUCCESS" : "FAILED"}
                  </Tag>
                </Space>
              </Space>
            </Card>
          </Col>

          {/* Right side - Statistics */}
          <Col span={8}>
            <Card
              title="Execution Statistics"
              size="small"
              style={{ backgroundColor: isDarkMode ? "#1f1f1f" : "#fff" }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Exit Code"
                    value={step.data.exitCode}
                    valueStyle={{ 
                      fontSize: "16px",
                      color: isSuccessful ? "#52c41a" : "#ff4d4f"
                    }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Total Output"
                    value={formatSize(commandStats.outputSize + commandStats.errorSize)}
                    valueStyle={{ fontSize: "16px" }}
                  />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: "16px" }}>
                <Col span={12}>
                  <Statistic
                    title="Output Lines"
                    value={commandStats.outputLines}
                    valueStyle={{ fontSize: "16px" }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Error Lines"
                    value={commandStats.errorLines}
                    valueStyle={{ fontSize: "16px" }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Status Alert */}
        {!isSuccessful && (
          <Alert
            message="Command Failed"
            description={`The command exited with code ${step.data.exitCode}. Check the error output below for details.`}
            type="error"
            showIcon
          />
        )}

        {/* Output Tabs */}
        <Card
          title="Command Output"
          size="small"
          style={{ backgroundColor: isDarkMode ? "#1f1f1f" : "#fff" }}
        >
          <div
            style={{
              border: `1px solid ${isDarkMode ? "#434343" : "#e5e5e5"}`,
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <Tabs
              defaultActiveKey={hasOutput ? "stdout" : "stderr"}
              size="small"
              items={[
                {
                  key: "stdout",
                  label: (
                    <Space>
                      <CheckCircleOutlined style={{ color: hasOutput ? "#52c41a" : "#8c8c8c" }} />
                      Standard Output
                      {hasOutput && <Tag size="small">{commandStats.outputLines}</Tag>}
                    </Space>
                  ),
                  children: renderOutputSection(
                    "Standard Output",
                    step.data.stdout,
                    "stdout",
                    <CheckCircleOutlined style={{ color: "#52c41a" }} />
                  ),
                },
                {
                  key: "stderr",
                  label: (
                    <Space>
                      <ExclamationCircleOutlined style={{ color: hasErrors ? "#ff4d4f" : "#8c8c8c" }} />
                      Standard Error
                      {hasErrors && <Tag size="small" color="error">{commandStats.errorLines}</Tag>}
                    </Space>
                  ),
                  children: renderOutputSection(
                    "Standard Error",
                    step.data.stderr,
                    "stderr",
                    <ExclamationCircleOutlined style={{ color: "#ff4d4f" }} />
                  ),
                },
              ]}
            />
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default CommandStepView;