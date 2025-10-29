import React, { useEffect, useRef } from "react";
import { Card, Typography, Alert, Spin, Space, Tag, Avatar } from "antd";
import mermaid from "mermaid";
import type { Step } from "../types/index";

const { Title, Text } = Typography;

interface FlowVisualizationProps {
  steps: Step[];
  selectedStep: number | null;
  onStepSelect: (stepIndex: number) => void;
  isDarkMode: boolean;
}

const FlowVisualization: React.FC<FlowVisualizationProps> = ({
  steps,
  selectedStep,
  onStepSelect,
  isDarkMode,
}) => {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: isDarkMode ? "dark" : "default",
      securityLevel: "loose",
      fontFamily: "'Fira Code', 'Source Code Pro', monospace",
      fontSize: 13,
      flowchart: {
        htmlLabels: true,
        curve: "basis",
        nodeSpacing: 50,
        rankSpacing: 80,
      },
      themeVariables: isDarkMode ? {
        darkMode: true,
        background: "#0f0f0f",
        primaryColor: "#374151",
        primaryTextColor: "#f3f4f6",
        primaryBorderColor: "#4b5563",
        lineColor: "#6b7280",
        secondaryColor: "#1f2937",
        tertiaryColor: "#374151",
      } : {
        background: "#f5f5f5",
        primaryColor: "#ffffff",
        primaryTextColor: "#000000",
        primaryBorderColor: "#d9d9d9",
        lineColor: "#8c8c8c",
        secondaryColor: "#f0f0f0",
        tertiaryColor: "#ffffff",
      },
    });
  }, [isDarkMode]);

  useEffect(() => {
    if (steps.length === 0) {
      setIsLoading(false);
      return;
    }

    // Group steps by group number
    const groupedSteps = steps.reduce((acc, step) => {
      if (!acc[step.group]) {
        acc[step.group] = [];
      }
      acc[step.group].push(step);
      return acc;
    }, {} as Record<number, Step[]>);

    // Sort groups by group number
    const sortedGroups = Object.keys(groupedSteps)
      .map(Number)
      .sort((a, b) => a - b);

    // Get group time range
    const getGroupTimeRange = (groupSteps: Step[]) => {
      const times = groupSteps.map(s => new Date(s.timestamp).getTime());
      const start = new Date(Math.min(...times));
      const end = new Date(Math.max(...times));
      return {
        start: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        end: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    };

    // Get all unique tags from a group
    const getGroupTags = (groupSteps: Step[]) => {
      const allTags = groupSteps.flatMap(step => step.tags || []);
      return Array.from(new Set(allTags));
    };

    // 그룹 기반 HTML 다이어그램 생성
    if (mermaidRef.current) {
      setIsLoading(false);
      mermaidRef.current.innerHTML = `
        <div style="padding: 20px; width: 100%; min-height: 100%; overflow-x: auto;">
          ${sortedGroups.map((groupNum, groupIndex) => {
            const groupSteps = groupedSteps[groupNum];
            const timeRange = getGroupTimeRange(groupSteps);
            const groupTags = getGroupTags(groupSteps);
            
            return `
              <div style="margin-bottom: 40px; border: 1px solid ${isDarkMode ? '#434343' : '#d9d9d9'}; border-radius: 12px; padding: 20px; background: ${isDarkMode ? '#1a1a1a' : '#fafafa'}; width: 100%; box-sizing: border-box;">
                <!-- Group Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="
                      width: 32px; height: 32px; border-radius: 50%; background: #1890ff; 
                      display: flex; align-items: center; justify-content: center; 
                      color: white; font-size: 16px; font-weight: bold;
                    ">
                      ${groupNum}
                    </div>
                    <div>
                      <div style="font-size: 16px; font-weight: bold; color: ${isDarkMode ? '#fff' : '#000'}; margin-bottom: 4px;">
                        Group ${groupNum}
                      </div>
                      <div style="font-size: 12px; color: ${isDarkMode ? '#999' : '#666'};">
                        ${timeRange.start} - ${timeRange.end} • ${groupSteps.length} steps
                      </div>
                    </div>
                  </div>
                  <div style="font-size: 12px; color: ${isDarkMode ? '#999' : '#666'};">
                    ${groupTags.length > 0 ? groupTags.slice(0, 3).map(tag => `<span style="background: #1890ff; color: white; padding: 2px 6px; border-radius: 3px; margin-right: 4px; font-size: 10px;">${tag}</span>`).join('') : ''}
                    ${groupTags.length > 3 ? `<span style="background: #666; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">+${groupTags.length - 3}</span>` : ''}
                  </div>
                </div>
                
                <!-- Group Steps -->
                <div style="display: flex; align-items: center; gap: 15px; justify-content: flex-start; flex-wrap: wrap; min-height: 100px; max-width: 100%; overflow-x: auto; padding: 10px 0;" class="flow-scroll">
                  ${groupSteps.length > 8 ? `
                    <div style="width: 100%; margin-bottom: 10px; text-align: center; font-size: 12px; color: ${isDarkMode ? '#999' : '#666'}; font-style: italic;">
                      ⚠️ Large group (${groupSteps.length} steps) - scroll horizontally to see all steps
                    </div>
                  ` : ''}
                  ${groupSteps.map((step, stepIndex) => {
                    const isSelected = selectedStep === step.stepIndex;
                    const stepColor = step.type === 'prompt' ? '#1890ff' : step.type === 'file_edit' ? '#52c41a' : step.type === 'command' ? '#722ed1' : step.type === 'assistant_response' ? '#f59e0b' : '#8c8c8c';
                    const stepIcon = step.type === 'prompt' ? '💬' : step.type === 'file_edit' ? '📝' : step.type === 'command' ? '💻' : step.type === 'assistant_response' ? '🤖' : '❓';
                    
                    return `
                      <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
                        <div 
                          onclick="window.selectStep(${step.stepIndex})"
                          style="
                            width: 140px;
                            height: 100px;
                            min-width: 140px;
                            border: 3px solid ${isSelected ? '#f59e0b' : stepColor};
                            background: ${isSelected ? (isDarkMode ? '#2d1b15' : '#fff7ed') : (isDarkMode ? '#1f1f1f' : '#fff')};
                            border-radius: 12px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            cursor: pointer;
                            transition: all 0.3s;
                            color: ${isDarkMode ? '#fff' : '#000'};
                            font-size: 12px;
                            text-align: center;
                            padding: 12px;
                            box-shadow: ${isSelected ? '0 8px 16px rgba(245, 158, 11, 0.3)' : '0 4px 8px rgba(0,0,0,0.1)'};
                            position: relative;
                            overflow: hidden;
                          "
                          onmouseover="this.style.transform='scale(1.08)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.2)'"
                          onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='${isSelected ? '0 8px 16px rgba(245, 158, 11, 0.3)' : '0 4px 8px rgba(0,0,0,0.1)'}'"
                        >
                          <!-- Step Icon -->
                          <div style="font-size: 20px; margin-bottom: 6px;">
                            ${stepIcon}
                          </div>
                          
                          <!-- Step Number -->
                          <div style="font-weight: bold; font-size: 14px; margin-bottom: 2px;">
                            Step ${step.stepIndex}
                          </div>
                          
                          <!-- Step Type -->
                          <div style="font-size: 10px; opacity: 0.8; margin-bottom: 4px;">
                            ${step.type}
                          </div>
                          
                          <!-- Step Title -->
                          ${step.title ? `
                            <div style="font-size: 10px; font-weight: 500; text-align: center; line-height: 1.2; max-height: 24px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                              ${step.title}
                            </div>
                          ` : ''}
                          
                          <!-- Step Tags -->
                          ${step.tags && step.tags.length > 0 ? `
                            <div style="position: absolute; bottom: 4px; right: 4px; font-size: 8px; background: ${stepColor}; color: white; padding: 1px 4px; border-radius: 2px; max-width: 40px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                              ${step.tags[0]}
                            </div>
                          ` : ''}
                          
                          <!-- Selected Indicator -->
                          ${isSelected ? `
                            <div style="position: absolute; top: 4px; right: 4px; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; animation: pulse 1.5s infinite;"></div>
                          ` : ''}
                        </div>
                        
                        <!-- Arrow between steps -->
                        ${stepIndex < groupSteps.length - 1 ? `
                          <div style="font-size: 24px; color: ${isDarkMode ? '#666' : '#999'}; font-weight: bold; flex-shrink: 0;">→</div>
                        ` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
              
              <!-- Group Separator -->
              ${groupIndex < sortedGroups.length - 1 ? `
                <div style="display: flex; align-items: center; margin: 30px 0; gap: 20px;">
                  <div style="flex: 1; height: 2px; background: linear-gradient(to right, transparent, ${isDarkMode ? '#434343' : '#d9d9d9'}, transparent);"></div>
                  <div style="font-size: 20px; color: ${isDarkMode ? '#666' : '#999'};">⬇</div>
                  <div style="flex: 1; height: 2px; background: linear-gradient(to right, transparent, ${isDarkMode ? '#434343' : '#d9d9d9'}, transparent);"></div>
                </div>
              ` : ''}
            `;
          }).join('')}
        </div>
        
        <style>
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        </style>
      `;

      // 글로벌 함수로 클릭 핸들러 등록
      (window as any).selectStep = (stepIndex: number) => {
        onStepSelect(stepIndex);
      };
    }
  }, [steps, selectedStep, onStepSelect, isDarkMode]);

  const headerStyle = {
    background: isDarkMode ? "#1f1f1f" : "#fafafa",
    borderBottom: `1px solid ${isDarkMode ? "#434343" : "#d9d9d9"}`,
    padding: "16px",
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={headerStyle}>
        <Title level={4} style={{ margin: 0, color: isDarkMode ? "#fff" : "#000" }}>
          🔄 Workflow Visualization
        </Title>
        <Text type="secondary">
          Click on any node to view details • Steps organized by conversation groups
        </Text>
      </div>

      <div style={{ flex: 1, padding: "16px", display: "flex", justifyContent: "center", alignItems: "flex-start", minHeight: 0 }}>
        <Card
          style={{
            width: "100%",
            maxWidth: "100%",
            height: "calc(100vh - 200px)",
            backgroundColor: isDarkMode ? "#1f1f1f" : "#fff",
            borderColor: isDarkMode ? "#434343" : "#d9d9d9",
            overflow: "hidden",
          }}
          bodyStyle={{
            padding: "0",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
            overflow: "auto",
          }}
        >
          {steps.length === 0 ? (
            <div style={{ textAlign: "center" }}>
              <Text type="secondary">No steps to visualize</Text>
            </div>
          ) : (
            <div
              ref={mermaidRef}
              style={{ 
                width: "100%", 
                height: "100%",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                overflow: "auto"
              }}
              className="flow-scroll"
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default FlowVisualization;
