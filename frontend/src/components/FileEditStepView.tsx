import React, { useMemo } from 'react';
import { Card, Typography, Space, Tag, Button, Row, Col, Statistic, Alert } from 'antd';
import { 
  CopyOutlined, 
  FileTextOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  FolderOutlined
} from '@ant-design/icons';
import * as Diff from 'diff';
import type { FileEditStep } from '../types/index';
import DiffViewer from './DiffViewer';

const { Text, Paragraph } = Typography;

interface FileEditStepViewProps {
  step: FileEditStep;
  isDarkMode: boolean;
  onCopy: (text: string) => void;
}

const FileEditStepView: React.FC<FileEditStepViewProps> = ({ step, isDarkMode, onCopy }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <PlusOutlined style={{ color: '#52c41a' }} />;
      case 'update':
        return <EditOutlined style={{ color: '#1890ff' }} />;
      case 'delete':
        return <DeleteOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'processing';
      case 'delete':
        return 'error';
      default:
        return 'default';
    }
  };

  const fileStats = useMemo(() => {
    const content = step.data.content;
    const lines = content.split('\n').length;
    const characters = content.length;
    const words = content.split(/\s+/).filter(word => word.length > 0).length;
    
    // Estimate file size
    const sizeInBytes = new Blob([content]).size;
    const sizeInKB = (sizeInBytes / 1024).toFixed(2);
    
    return { lines, characters, words, sizeInKB };
  }, [step.data.content]);

  const getFileExtension = (path: string) => {
    return path.split('.').pop()?.toLowerCase() || '';
  };

  const getLanguageFromExtension = (ext: string) => {
    const languageMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'jsx': 'React JSX',
      'ts': 'TypeScript',
      'tsx': 'React TSX',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'json': 'JSON',
      'md': 'Markdown',
      'yml': 'YAML',
      'yaml': 'YAML',
      'xml': 'XML',
      'sql': 'SQL',
    };
    return languageMap[ext] || ext.toUpperCase();
  };

  const fileName = step.data.path.split('/').pop() || '';
  const folderPath = step.data.path.substring(0, step.data.path.lastIndexOf('/')) || '';
  const fileExtension = getFileExtension(step.data.path);
  const language = getLanguageFromExtension(fileExtension);

  // For diff comparison (if it's an update action)
  const showDiff = step.data.action === 'update';

  return (
    <div style={{ padding: "24px 32px" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* File Info */}
        <Row gutter={24}>
          {/* Left side - File Info */}
          <Col span={16}>
            <Card
              title={
                <Space>
                  {getActionIcon(step.data.action)}
                  <Text strong>File {step.data.action === 'create' ? 'Created' : 
                                  step.data.action === 'update' ? 'Modified' : 'Deleted'}</Text>
                </Space>
              }
              size="small"
              style={{ backgroundColor: isDarkMode ? "#1f1f1f" : "#fff" }}
            >
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                {/* File Path */}
                <div>
                  <Space>
                    <FolderOutlined style={{ color: isDarkMode ? "#8c8c8c" : "#666" }} />
                    <Text code style={{ fontSize: "14px" }}>
                      {folderPath && <span style={{ color: isDarkMode ? "#8c8c8c" : "#666" }}>{folderPath}/</span>}
                      <span style={{ fontWeight: "bold" }}>{fileName}</span>
                    </Text>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => onCopy(step.data.path)}
                    >
                      Copy Path
                    </Button>
                  </Space>
                </div>

                {/* Action & Language */}
                <Space>
                  <Tag color={getActionColor(step.data.action)} icon={getActionIcon(step.data.action)} style={{ fontSize: "12px", padding: "4px 8px" }}>
                    {step.data.action.toUpperCase()}
                  </Tag>
                  {fileExtension && (
                    <Tag color="blue" style={{ fontSize: "12px", padding: "4px 8px" }}>{language}</Tag>
                  )}
                </Space>
              </Space>
            </Card>
          </Col>

          {/* Right side - File Stats */}
          <Col span={8}>
            <Card
              title="File Statistics"
              size="small"
              style={{ backgroundColor: isDarkMode ? "#1f1f1f" : "#fff" }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Lines"
                    value={fileStats.lines}
                    valueStyle={{ fontSize: "16px" }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Size"
                    value={fileStats.sizeInKB}
                    suffix="KB"
                    valueStyle={{ fontSize: "16px" }}
                  />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: "16px" }}>
                <Col span={12}>
                  <Statistic
                    title="Characters"
                    value={fileStats.characters}
                    valueStyle={{ fontSize: "16px" }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Words"
                    value={fileStats.words}
                    valueStyle={{ fontSize: "16px" }}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Diff Viewer for Updates */}
        {showDiff && (
          <Card
            title="Changes Comparison"
            size="small"
            style={{ backgroundColor: isDarkMode ? "#1f1f1f" : "#fff" }}
          >
            <Alert
              message="Diff Comparison"
              description="This shows a simulated diff. In a real implementation, you would compare with the previous version of the file."
              type="info"
              showIcon
              style={{ marginBottom: "16px" }}
            />
            <DiffViewer
              oldValue={`// Previous version of ${fileName}\n// This would be the actual previous content\n// from your file tracking system\n\nfunction oldImplementation() {\n  return 'old code';\n}`}
              newValue={step.data.content}
              oldTitle="Previous Version"
              newTitle="Current Version"
              isDarkMode={isDarkMode}
              onCopyOld={() => onCopy("Previous version content would be here")}
              onCopyNew={() => onCopy(step.data.content)}
            />
          </Card>
        )}

        {/* File Content */}
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: "#1890ff" }} />
              <Text strong>File Content</Text>
            </Space>
          }
          size="small"
          extra={
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => onCopy(step.data.content)}
            >
              Copy Content
            </Button>
          }
          style={{ backgroundColor: isDarkMode ? "#1f1f1f" : "#fff" }}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? "#262626" : "#f5f5f5",
              border: `1px solid ${isDarkMode ? "#434343" : "#e5e5e5"}`,
              borderRadius: "6px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: isDarkMode ? "#1a1a1a" : "#fafafa",
                borderBottom: `1px solid ${isDarkMode ? "#434343" : "#e5e5e5"}`,
                fontSize: "12px",
                color: isDarkMode ? "#8c8c8c" : "#666",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{fileName} • {language}</span>
              <span>{fileStats.lines} lines • {fileStats.sizeInKB} KB</span>
            </div>
            <div
              style={{
                height: "600px",
                overflow: "auto",
                display: "flex",
              }}
              className="custom-scroll"
            >
              {/* Line numbers */}
              <div
                style={{
                  width: "60px",
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
                {step.data.content.split('\n').map((_, index) => (
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
              
              {/* Content */}
              <Paragraph
                copyable={false}
                style={{
                  margin: 0,
                  padding: "16px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                  color: isDarkMode ? "#e5e5e5" : "#333",
                  flex: 1,
                }}
              >
                {step.data.content}
              </Paragraph>
            </div>
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default FileEditStepView;