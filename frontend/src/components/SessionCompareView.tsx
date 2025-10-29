import React, { useState, useMemo } from 'react';
import {
  Card,
  Typography,
  Space,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Tabs,
  Alert,
  Progress,
  Divider,
  Modal,
} from 'antd';
import {
  SwapOutlined,
  CheckCircleOutlined,
  EditOutlined,
  PlusOutlined,
  MinusOutlined,
  InfoCircleOutlined,
  BarChartOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { SessionComparison, StepComparison, Session } from '../types/index';
import { compareSessions } from '../utils/replayUtils';
import DiffViewer from './DiffViewer';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface SessionCompareViewProps {
  originalSession: Session;
  replaySession: Session;
  isDarkMode: boolean;
  onClose: () => void;
}

const SessionCompareView: React.FC<SessionCompareViewProps> = ({
  originalSession,
  replaySession,
  isDarkMode,
  onClose,
}) => {
  const [selectedStepComparison, setSelectedStepComparison] = useState<StepComparison | null>(null);
  const [diffModalVisible, setDiffModalVisible] = useState(false);

  const comparison = useMemo(
    () => compareSessions(originalSession, replaySession),
    [originalSession, replaySession]
  );

  const getStatusIcon = (status: StepComparison['status']) => {
    switch (status) {
      case 'identical':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'modified':
        return <EditOutlined style={{ color: '#faad14' }} />;
      case 'added':
        return <PlusOutlined style={{ color: '#1890ff' }} />;
      case 'removed':
        return <MinusOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  const getStatusColor = (status: StepComparison['status']) => {
    switch (status) {
      case 'identical':
        return 'success';
      case 'modified':
        return 'warning';
      case 'added':
        return 'processing';
      case 'removed':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleViewDiff = (stepComparison: StepComparison) => {
    setSelectedStepComparison(stepComparison);
    setDiffModalVisible(true);
  };

  const getStepContent = (step: any) => {
    if (!step) return '';
    
    switch (step.type) {
      case 'prompt':
        return step.data.response;
      case 'file_edit':
        return step.data.content;
      case 'command':
        return step.data.stdout;
      default:
        return JSON.stringify(step.data, null, 2);
    }
  };

  const columns = [
    {
      title: 'Step',
      dataIndex: 'stepIndex',
      key: 'stepIndex',
      width: 80,
      render: (stepIndex: number) => (
        <Text strong style={{ fontFamily: 'monospace' }}>
          #{stepIndex}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: StepComparison['status']) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Original Type',
      dataIndex: 'originalStep',
      key: 'originalType',
      width: 120,
      render: (step: any) => step ? (
        <Tag color="blue">{step.type.toUpperCase()}</Tag>
      ) : (
        <Text type="secondary">—</Text>
      ),
    },
    {
      title: 'Replay Type',
      dataIndex: 'replayStep',
      key: 'replayType',
      width: 120,
      render: (step: any) => step ? (
        <Tag color="green">{step.type.toUpperCase()}</Tag>
      ) : (
        <Text type="secondary">—</Text>
      ),
    },
    {
      title: 'Differences',
      dataIndex: 'differences',
      key: 'differences',
      render: (differences: string[]) => (
        <div>
          {differences.length === 0 ? (
            <Text type="secondary">No changes</Text>
          ) : (
            <div>
              {differences.slice(0, 2).map((diff, index) => (
                <div key={index}>
                  <Text style={{ fontSize: '12px' }}>• {diff}</Text>
                </div>
              ))}
              {differences.length > 2 && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  +{differences.length - 2} more...
                </Text>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record: StepComparison) => (
        <Space size="small">
          {record.status === 'modified' && record.originalStep && record.replayStep && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDiff(record)}
            >
              Diff
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const completionPercentage = Math.round(
    (comparison.summary.identicalSteps / comparison.summary.totalStepsOriginal) * 100
  );

  return (
    <div style={{ height: '100vh', overflow: 'auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0, color: isDarkMode ? '#fff' : '#000' }}>
              <SwapOutlined style={{ marginRight: '12px', color: '#1890ff' }} />
              Session Comparison
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Comparing original vs replay workflow results
            </Text>
          </Col>
          <Col>
            <Button size="large" onClick={onClose}>
              Close Comparison
            </Button>
          </Col>
        </Row>
      </div>

      <Row gutter={24} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card
            title="Original Session"
            size="small"
            style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#fff' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{originalSession.title}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {originalSession.sessionId}
              </Text>
              <Text type="secondary">
                Created: {new Date(originalSession.createdAt).toLocaleString()}
              </Text>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title="Replay Session"
            size="small"
            style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#fff' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>{replaySession.title}</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {replaySession.sessionId}
              </Text>
              <Text type="secondary">
                Created: {new Date(replaySession.createdAt).toLocaleString()}
              </Text>
              {replaySession.replayFromStepIndex && (
                <Tag color="orange">
                  Replayed from step {replaySession.replayFromStepIndex}
                </Tag>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <BarChartOutlined style={{ color: '#722ed1' }} />
            <Text strong>Comparison Summary</Text>
          </Space>
        }
        size="small"
        style={{ marginBottom: '24px', backgroundColor: isDarkMode ? '#1f1f1f' : '#fff' }}
      >
        <Row gutter={24}>
          <Col span={6}>
            <Statistic
              title="Original Steps"
              value={comparison.summary.totalStepsOriginal}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Replay Steps"
              value={comparison.summary.totalStepsReplay}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Modified"
              value={comparison.summary.modifiedSteps}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Similarity"
              value={completionPercentage}
              suffix="%"
              valueStyle={{ color: completionPercentage > 80 ? '#52c41a' : '#faad14' }}
            />
          </Col>
        </Row>

        <Divider />

        <Row gutter={16}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Identical</Text>
              <Progress
                type="circle"
                size={60}
                percent={Math.round((comparison.summary.identicalSteps / comparison.summary.totalStepsOriginal) * 100)}
                strokeColor="#52c41a"
                format={() => comparison.summary.identicalSteps}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Modified</Text>
              <Progress
                type="circle"
                size={60}
                percent={Math.round((comparison.summary.modifiedSteps / comparison.summary.totalStepsOriginal) * 100)}
                strokeColor="#faad14"
                format={() => comparison.summary.modifiedSteps}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Added</Text>
              <Progress
                type="circle"
                size={60}
                percent={Math.round((comparison.summary.addedSteps / comparison.summary.totalStepsReplay) * 100)}
                strokeColor="#1890ff"
                format={() => comparison.summary.addedSteps}
              />
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">Removed</Text>
              <Progress
                type="circle"
                size={60}
                percent={Math.round((comparison.summary.removedSteps / comparison.summary.totalStepsOriginal) * 100)}
                strokeColor="#ff4d4f"
                format={() => comparison.summary.removedSteps}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {comparison.summary.modifiedSteps > 0 && (
        <Alert
          message="Workflow Differences Detected"
          description={`${comparison.summary.modifiedSteps} steps have different results between original and replay execution.`}
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Card
        title="Step-by-Step Comparison"
        size="small"
        style={{ backgroundColor: isDarkMode ? '#1f1f1f' : '#fff' }}
      >
        <Table
          columns={columns}
          dataSource={comparison.stepComparisons}
          rowKey="stepIndex"
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} steps`,
          }}
          scroll={{ y: 400 }}
          size="small"
        />
      </Card>

      {/* Diff Modal */}
      <Modal
        title={
          selectedStepComparison ? 
            `Step ${selectedStepComparison.stepIndex} Comparison` : 
            'Step Comparison'
        }
        open={diffModalVisible}
        onCancel={() => setDiffModalVisible(false)}
        footer={null}
        width={1400}
        style={{ top: 20 }}
        styles={{
          body: { padding: '16px' }
        }}
      >
        {selectedStepComparison && selectedStepComparison.originalStep && selectedStepComparison.replayStep && (
          <div>
            <Space style={{ marginBottom: '16px' }}>
              <Tag color="blue">
                Original: {selectedStepComparison.originalStep.type.toUpperCase()}
              </Tag>
              <Tag color="green">
                Replay: {selectedStepComparison.replayStep.type.toUpperCase()}
              </Tag>
            </Space>
            
            {selectedStepComparison.differences && selectedStepComparison.differences.length > 0 && (
              <Alert
                message="Detected Changes"
                description={
                  <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    {selectedStepComparison.differences.map((diff, index) => (
                      <li key={index}>{diff}</li>
                    ))}
                  </ul>
                }
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}
            
            <DiffViewer
              oldValue={getStepContent(selectedStepComparison.originalStep)}
              newValue={getStepContent(selectedStepComparison.replayStep)}
              oldTitle={`Original (Step ${selectedStepComparison.originalStep.stepIndex})`}
              newTitle={`Replay (Step ${selectedStepComparison.replayStep.stepIndex})`}
              isDarkMode={isDarkMode}
              onCopyOld={() => navigator.clipboard.writeText(getStepContent(selectedStepComparison.originalStep))}
              onCopyNew={() => navigator.clipboard.writeText(getStepContent(selectedStepComparison.replayStep))}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SessionCompareView;