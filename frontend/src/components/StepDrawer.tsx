import React, { useEffect } from 'react';
import { Drawer, Typography, Space } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import StepDetail from './StepDetail';
import type { Step } from '../types/index';

const { Title } = Typography;

interface StepDrawerProps {
  open: boolean;
  onClose: () => void;
  step: Step | null;
  steps: Step[];
  isDarkMode: boolean;
  onReplayFromHere?: (step: Step) => Promise<void>;
  onStepSelect?: (stepIndex: number) => void;
}

const StepDrawer: React.FC<StepDrawerProps> = ({
  open,
  onClose,
  step,
  steps,
  isDarkMode,
  onReplayFromHere,
  onStepSelect,
}) => {
  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);
  const drawerStyles = {
    body: {
      padding: 0,
      backgroundColor: isDarkMode ? '#141414' : '#fafafa',
    },
    header: {
      backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
      borderBottom: `1px solid ${isDarkMode ? '#434343' : '#d9d9d9'}`,
      padding: '16px 24px',
    },
    content: {
      backgroundColor: isDarkMode ? '#141414' : '#fafafa',
    }
  };

  const getStepTypeText = (type: string) => {
    switch (type) {
      case 'prompt':
        return 'LLM Prompt & Response';
      case 'file_edit':
        return 'File Edit Operation';
      case 'command':
        return 'Command Execution';
      case 'assistant_response':
        return 'Claude의 응답';
      default:
        return type;
    }
  };

  return (
    <Drawer
      title={
        step ? (
          <Space direction="vertical" size={0}>
            <Title 
              level={4} 
              style={{ 
                margin: 0, 
                color: isDarkMode ? '#fff' : '#000',
                fontSize: '18px'
              }}
            >
              Step {step.stepIndex}
              {step.title && ` - ${step.title}`}
            </Title>
            <Typography.Text 
              type="secondary" 
              style={{ 
                fontSize: '14px',
                color: isDarkMode ? '#8c8c8c' : '#666'
              }}
            >
              {getStepTypeText(step.type)}
            </Typography.Text>
          </Space>
        ) : 'Step Details'
      }
      placement="right"
      width="80%"
      open={open}
      onClose={onClose}
      closable={true}
      maskClosable={true}
      closeIcon={<CloseOutlined style={{ color: isDarkMode ? '#fff' : '#000' }} />}
      styles={drawerStyles}
      className={isDarkMode ? 'drawer-dark-mode' : 'drawer-light-mode'}
    >
      <div style={{ 
        height: '100%', 
        backgroundColor: isDarkMode ? '#141414' : '#fafafa',
        overflow: 'hidden'
      }}>
        <StepDetail
          step={step}
          isDarkMode={isDarkMode}
          onReplayFromHere={onReplayFromHere}
          steps={steps}
          onStepSelect={onStepSelect}
        />
      </div>
    </Drawer>
  );
};

export default StepDrawer;