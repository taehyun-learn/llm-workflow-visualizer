import React, { useState } from "react";
import {
  Typography,
  Space,
  Button,
  Empty,
  message,
  Divider,
} from "antd";
import {
  CopyOutlined,
  BranchesOutlined,
} from "@ant-design/icons";
import type { Step, PromptStep, FileEditStep, CommandStep, AssistantResponseStep } from "../types/index";
import StepDetailHeader from "./StepDetailHeader";
import PromptStepView from "./PromptStepView";
import FileEditStepView from "./FileEditStepView";
import CommandStepView from "./CommandStepView";
import AssistantResponseView from "./AssistantResponseView";

const { Text } = Typography;

interface StepDetailProps {
  step: Step | null;
  isDarkMode: boolean;
  onReplayFromHere?: (step: Step) => Promise<void>;
  steps?: Step[];
  onStepSelect?: (stepIndex: number) => void;
}

const StepDetail: React.FC<StepDetailProps> = ({ step, isDarkMode, onReplayFromHere, steps = [], onStepSelect }) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isReplayingFromHere, setIsReplayingFromHere] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success("Copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
      message.error("Failed to copy to clipboard");
    }
  };


  const handleReplayFromHere = async () => {
    if (!step || !onReplayFromHere) return;
    
    setIsReplayingFromHere(true);
    try {
      await onReplayFromHere(step);
      message.success("Workflow replayed from this step successfully!");
    } catch (error) {
      message.error("Failed to replay workflow from this step");
    } finally {
      setIsReplayingFromHere(false);
    }
  };

  const canReplayFromHere = step && onReplayFromHere && ['prompt', 'command', 'file_edit'].includes(step.type);

  if (!step) {
    return (
      <div
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <div
          style={{
            background: isDarkMode ? "#1f1f1f" : "#fafafa",
            borderBottom: `1px solid ${isDarkMode ? "#434343" : "#d9d9d9"}`,
            padding: "16px",
          }}
        >
          <Text
            strong
            style={{ fontSize: "16px", color: isDarkMode ? "#fff" : "#000" }}
          >
            🔍 Step Details
          </Text>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No step selected"
          >
            <Text type="secondary">
              Click on a step from the list or diagram to view details
            </Text>
          </Empty>
        </div>
      </div>
    );
  }


  const renderStepContent = () => {
    switch (step.type) {
      case 'prompt':
        return (
          <PromptStepView
            step={step as PromptStep}
            isDarkMode={isDarkMode}
            onCopy={copyToClipboard}
            allSteps={steps}
          />
        );
      case 'file_edit':
        return (
          <FileEditStepView
            step={step as FileEditStep}
            isDarkMode={isDarkMode}
            onCopy={copyToClipboard}
          />
        );
      case 'command':
        return (
          <CommandStepView
            step={step as CommandStep}
            isDarkMode={isDarkMode}
            onCopy={copyToClipboard}
          />
        );
      case 'assistant_response':
        return (
          <AssistantResponseView
            step={step as AssistantResponseStep}
            isDarkMode={isDarkMode}
            onCopy={copyToClipboard}
            allSteps={steps}
            onStepSelect={onStepSelect}
          />
        );
      default:
        return (
          <div style={{ padding: "16px", textAlign: "center" }}>
            <Text type="secondary">
              Unsupported step type: {step.type}
            </Text>
          </div>
        );
    }
  };

  // For assistant_response, render the component directly without additional layout
  if (step.type === 'assistant_response') {
    return renderStepContent();
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflow: "auto", minHeight: 0 }} className="custom-scroll">
        <StepDetailHeader step={step} isDarkMode={isDarkMode} steps={steps} />
        {renderStepContent()}
      </div>

      <Divider style={{ margin: "0", flexShrink: 0 }} />
      <div style={{ padding: "24px 32px", flexShrink: 0 }}>
        <Space style={{ width: "100%", justifyContent: "center" }} size="large" wrap>
          <Button
            disabled={!canReplayFromHere}
            loading={isReplayingFromHere}
            icon={<BranchesOutlined />}
            onClick={handleReplayFromHere}
            type="primary"
            size="large"
            style={{ minWidth: "160px" }}
          >
            {isReplayingFromHere ? "Replaying..." : "Replay from here"}
          </Button>
          <Button
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(JSON.stringify(step, null, 2))}
            size="large"
            style={{ minWidth: "120px" }}
          >
            Copy JSON
          </Button>
        </Space>
      </div>

    </div>
  );
};

export default StepDetail;
