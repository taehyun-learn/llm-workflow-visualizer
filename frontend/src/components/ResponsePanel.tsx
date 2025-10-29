import React, { useMemo } from 'react';
import { Card, Typography, Space, Empty, List, Button, Drawer, Tag, Avatar, Divider } from 'antd';
import { RobotOutlined, CopyOutlined, MessageOutlined, CloseOutlined } from '@ant-design/icons';
import type { AssistantResponseStep, Step } from '../types/index';

const { Text, Paragraph, Title } = Typography;

interface ResponsePanelProps {
  visible: boolean;
  onClose: () => void;
  allSteps: Step[];
  isDarkMode: boolean;
  onCopy: (text: string) => void;
}

const ResponsePanel: React.FC<ResponsePanelProps> = ({ 
  visible, 
  onClose, 
  allSteps, 
  isDarkMode, 
  onCopy 
}) => {
  const responseSteps = useMemo(() => {
    return allSteps
      .filter(step => step.type === 'assistant_response')
      .map(step => step as AssistantResponseStep)
      .sort((a, b) => a.stepIndex - b.stepIndex);
  }, [allSteps]);

  const getRelatedPrompt = (responseStep: AssistantResponseStep) => {
    return allSteps.find(step => 
      step.type === 'prompt' && 
      step.group === responseStep.group
    );
  };

  const getResponsePreview = (response: string, maxLength = 150) => {
    if (response.length <= maxLength) return response;
    return response.substring(0, maxLength) + '...';
  };

  return (
    <Drawer
      title={
        <Space>
          <RobotOutlined style={{ color: '#52c41a' }} />
          <Text strong>AI Responses Summary</Text>
          <Tag color="green">{responseSteps.length} responses</Tag>
        </Space>
      }
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
      extra={
        <Button 
          type="text" 
          icon={<CloseOutlined />} 
          onClick={onClose}
          style={{ color: isDarkMode ? '#fff' : '#000' }}
        />
      }
      style={{
        backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
      }}
      bodyStyle={{
        backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
        padding: '16px',
      }}
    >
      {responseSteps.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No AI responses found"
        >
          <Text type="secondary">
            No assistant_response steps found in the current session
          </Text>
        </Empty>
      ) : (
        <div>
          <Card
            size="small"
            style={{ 
              marginBottom: '16px',
              backgroundColor: isDarkMode ? '#262626' : '#f5f5f5',
              border: `1px solid ${isDarkMode ? '#434343' : '#d9d9d9'}`,
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong style={{ color: isDarkMode ? '#fff' : '#000' }}>
                📊 Response Overview
              </Text>
              <Space wrap>
                <Text type="secondary">Total Responses: {responseSteps.length}</Text>
                <Text type="secondary">
                  Avg Length: {Math.round(
                    responseSteps.reduce((sum, step) => sum + step.data.response.length, 0) / responseSteps.length
                  )} chars
                </Text>
                <Text type="secondary">
                  Total Characters: {responseSteps.reduce((sum, step) => sum + step.data.response.length, 0)}
                </Text>
              </Space>
            </Space>
          </Card>

          <List
            dataSource={responseSteps}
            renderItem={(responseStep, index) => {
              const relatedPrompt = getRelatedPrompt(responseStep);
              const responseLength = responseStep.data.response.length;
              
              return (
                <List.Item style={{ padding: '0 0 16px 0' }}>
                  <Card
                    size="small"
                    style={{
                      width: '100%',
                      backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
                      border: `1px solid ${isDarkMode ? '#434343' : '#d9d9d9'}`,
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Avatar
                            size="small"
                            icon={<RobotOutlined />}
                            style={{ backgroundColor: '#52c41a' }}
                          />
                          <Text strong style={{ color: isDarkMode ? '#fff' : '#000' }}>
                            Response #{index + 1}
                          </Text>
                          <Tag color="blue">Group {responseStep.group}</Tag>
                        </Space>
                        <Space>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {responseLength} chars
                          </Text>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {new Date(responseStep.timestamp).toLocaleTimeString()}
                          </Text>
                        </Space>
                      </div>
                      
                      {relatedPrompt && (
                        <div style={{ 
                          marginTop: '8px', 
                          padding: '8px 12px',
                          backgroundColor: isDarkMode ? '#262626' : '#f0f0f0',
                          borderRadius: '4px',
                          borderLeft: `3px solid #1890ff`,
                        }}>
                          <Space>
                            <MessageOutlined style={{ color: '#1890ff', fontSize: '12px' }} />
                            <Text style={{ fontSize: '12px', color: isDarkMode ? '#ccc' : '#666' }}>
                              Related prompt: {getResponsePreview(relatedPrompt.data.prompt, 100)}
                            </Text>
                          </Space>
                        </div>
                      )}
                    </div>

                    <div style={{
                      backgroundColor: isDarkMode ? '#262626' : '#f5f5f5',
                      border: `1px solid ${isDarkMode ? '#434343' : '#e5e5e5'}`,
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '12px',
                      maxHeight: '200px',
                      overflow: 'auto',
                    }} className="custom-scroll">
                      <Paragraph
                        style={{
                          margin: 0,
                          fontFamily: 'monospace',
                          fontSize: '12px',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap',
                          color: isDarkMode ? '#e5e5e5' : '#333',
                        }}
                      >
                        {getResponsePreview(responseStep.data.response, 500)}
                      </Paragraph>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => onCopy(responseStep.data.response)}
                      >
                        Copy Full Response
                      </Button>
                    </div>
                  </Card>
                </List.Item>
              );
            }}
          />
        </div>
      )}
    </Drawer>
  );
};

export default ResponsePanel;