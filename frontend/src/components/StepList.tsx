import React, { useState, useMemo } from "react";
import { List, Card, Tag, Typography, Avatar, Space, Empty, Divider, Input, Select, Button, Collapse } from "antd";
import { MessageOutlined, EditOutlined, CodeOutlined, GroupOutlined, SearchOutlined, FilterOutlined, ClearOutlined, HistoryOutlined, DownOutlined, RightOutlined } from "@ant-design/icons";
import type { Step } from "../types/index";

const { Text, Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { Panel } = Collapse;

interface StepListProps {
  steps: Step[];
  selectedStep: number | null;
  onStepSelect: (stepIndex: number) => void;
  isDarkMode: boolean;
}

const StepList: React.FC<StepListProps> = ({
  steps,
  selectedStep,
  onStepSelect,
  isDarkMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'prompt' | 'file_edit' | 'command' | 'assistant_response'>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const getStepIcon = (type: Step["type"]) => {
    switch (type) {
      case "prompt":
        return <MessageOutlined />;
      case "file_edit":
        return <EditOutlined />;
      case "command":
        return <CodeOutlined />;
      case "assistant_response":
        return <MessageOutlined />;
      default:
        return <CodeOutlined />;
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
      case "assistant_response":
        return "#f59e0b";
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
      case "assistant_response":
        return "orange";
      default:
        return "default";
    }
  };

  const getStepPreview = (step: Step) => {
    switch (step.type) {
      case "prompt":
        return step.data.prompt.substring(0, 60) + "...";
      case "file_edit":
        return step.data.path.split("/").pop() || step.data.path;
      case "command":
        return step.data.command.substring(0, 60) + "...";
      case "assistant_response":
        return step.data.response.substring(0, 60) + "...";
      default:
        return "";
    }
  };

  const headerStyle = {
    background: isDarkMode ? "#141414" : "#ffffff",
    borderBottom: `1px solid ${isDarkMode ? "#434343" : "#d9d9d9"}`,
    padding: "20px 16px",
    borderRadius: "8px 8px 0 0",
    boxShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
  };

  // Show all steps including assistant_response
  const actionSteps = useMemo(() => {
    return steps;
  }, [steps]);

  const summaryStats = {
    total: actionSteps.length,
    prompts: actionSteps.filter(s => s.type === 'prompt').length,
    files: actionSteps.filter(s => s.type === 'file_edit').length,
    commands: actionSteps.filter(s => s.type === 'command').length,
    responses: actionSteps.filter(s => s.type === 'assistant_response').length,
  };

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

  // Get all unique tags from all steps
  const allTags = useMemo(() => {
    const tags = steps.flatMap(step => step.tags || []);
    return Array.from(new Set(tags)).sort();
  }, [steps]);

  // Filter and search steps
  const filteredSteps = useMemo(() => {
    return actionSteps.filter(step => {
      // Type filter
      if (filterType !== 'all' && step.type !== filterType) {
        return false;
      }
      
      // Tag filter
      if (filterTag !== 'all' && (!step.tags || !step.tags.includes(filterTag))) {
        return false;
      }
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = step.title?.toLowerCase().includes(searchLower) || false;
        const tagMatch = step.tags?.some(tag => tag.toLowerCase().includes(searchLower)) || false;
        const contentMatch = (() => {
          switch (step.type) {
            case 'prompt':
              return step.data.prompt.toLowerCase().includes(searchLower);
            case 'file_edit':
              return step.data.path.toLowerCase().includes(searchLower) || 
                     step.data.content.toLowerCase().includes(searchLower);
            case 'command':
              return step.data.command.toLowerCase().includes(searchLower) || 
                     step.data.stdout.toLowerCase().includes(searchLower);
            case 'assistant_response':
              return step.data.response.toLowerCase().includes(searchLower);
            default:
              return false;
          }
        })();
        
        if (!titleMatch && !tagMatch && !contentMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [actionSteps, searchTerm, filterType, filterTag]);

  // Group filtered steps
  const filteredGroupedSteps = useMemo(() => {
    return filteredSteps.reduce((acc, step) => {
      if (!acc[step.group]) {
        acc[step.group] = [];
      }
      acc[step.group].push(step);
      return acc;
    }, {} as Record<number, Step[]>);
  }, [filteredSteps]);

  // Sort groups by group number
  const filteredSortedGroups = useMemo(() => {
    return Object.keys(filteredGroupedSteps)
      .map(Number)
      .sort((a, b) => a - b);
  }, [filteredGroupedSteps]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterTag('all');
  };

  // Check if filters are active
  const hasActiveFilters = searchTerm || filterType !== 'all' || filterTag !== 'all';

  // Toggle group collapse (기본적으로 모든 그룹이 접혀있음)
  const toggleGroup = (groupNum: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupNum)) {
      newExpanded.delete(groupNum); // 접기
    } else {
      newExpanded.add(groupNum); // 펼치기
    }
    setExpandedGroups(newExpanded);
  };

  if (steps.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Empty description="No steps loaded" />
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '6px', 
                background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                📜
              </div>
              <Title level={4} style={{ margin: 0, color: isDarkMode ? "#fff" : "#000", fontSize: '18px' }}>
                Workflow Steps
              </Title>
            </div>
            <Text type="secondary" style={{ fontSize: '12px', marginLeft: '40px' }}>
              {steps.length} total steps across {Object.keys(filteredGroupedSteps).length} groups
            </Text>
          </div>
          <Button 
            type={showFilters ? "primary" : "default"}
            ghost={showFilters}
            size="small"
            icon={<FilterOutlined />} 
            onClick={() => setShowFilters(!showFilters)}
            style={{ 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Filters
          </Button>
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px', 
          marginBottom: showFilters ? 16 : 0,
          padding: '12px 0'
        }}>
          <div style={{ 
            background: isDarkMode ? 'rgba(24, 144, 255, 0.1)' : 'rgba(24, 144, 255, 0.05)',
            border: `1px solid ${isDarkMode ? 'rgba(24, 144, 255, 0.3)' : 'rgba(24, 144, 255, 0.2)'}`,
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '11px',
            color: '#1890ff',
            fontWeight: '500'
          }}>
            {summaryStats.prompts} prompts
          </div>
          <div style={{ 
            background: isDarkMode ? 'rgba(82, 196, 26, 0.1)' : 'rgba(82, 196, 26, 0.05)',
            border: `1px solid ${isDarkMode ? 'rgba(82, 196, 26, 0.3)' : 'rgba(82, 196, 26, 0.2)'}`,
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '11px',
            color: '#52c41a',
            fontWeight: '500'
          }}>
            {summaryStats.files} files
          </div>
          <div style={{ 
            background: isDarkMode ? 'rgba(114, 46, 209, 0.1)' : 'rgba(114, 46, 209, 0.05)',
            border: `1px solid ${isDarkMode ? 'rgba(114, 46, 209, 0.3)' : 'rgba(114, 46, 209, 0.2)'}`,
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '11px',
            color: '#722ed1',
            fontWeight: '500'
          }}>
            {summaryStats.commands} commands
          </div>
          <div style={{ 
            background: isDarkMode ? 'rgba(250, 173, 20, 0.1)' : 'rgba(250, 173, 20, 0.05)',
            border: `1px solid ${isDarkMode ? 'rgba(250, 173, 20, 0.3)' : 'rgba(250, 173, 20, 0.2)'}`,
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '11px',
            color: '#faad14',
            fontWeight: '500'
          }}>
            {summaryStats.responses} responses
          </div>
          {hasActiveFilters && (
            <div style={{ 
              background: isDarkMode ? 'rgba(235, 47, 150, 0.1)' : 'rgba(235, 47, 150, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(235, 47, 150, 0.3)' : 'rgba(235, 47, 150, 0.2)'}`,
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11px',
              color: '#eb2f96',
              fontWeight: '500'
            }}>
              {filteredSteps.length} filtered
            </div>
          )}
        </div>
        
        {showFilters && (
          <Collapse ghost activeKey={showFilters ? ['1'] : []}>
            <Panel key="1" header="" showArrow={false} style={{ padding: 0 }}>
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Search
                  placeholder="Search steps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%' }}
                  allowClear
                />
                
                <Space wrap style={{ width: '100%' }}>
                  <Select
                    value={filterType}
                    onChange={setFilterType}
                    style={{ width: 120 }}
                    size="small"
                  >
                    <Option value="all">All Types</Option>
                    <Option value="prompt">Prompts</Option>
                    <Option value="file_edit">Files</Option>
                    <Option value="command">Commands</Option>
                    <Option value="assistant_response">Responses</Option>
                  </Select>
                  
                  <Select
                    value={filterTag}
                    onChange={setFilterTag}
                    style={{ width: 140 }}
                    size="small"
                  >
                    <Option value="all">All Tags</Option>
                    {allTags.map(tag => (
                      <Option key={tag} value={tag}>{tag}</Option>
                    ))}
                  </Select>
                  
                  {hasActiveFilters && (
                    <Button
                      type="text"
                      size="small"
                      icon={<ClearOutlined />}
                      onClick={clearFilters}
                      style={{ color: isDarkMode ? '#fff' : '#000' }}
                    >
                      Clear
                    </Button>
                  )}
                </Space>
              </Space>
            </Panel>
          </Collapse>
        )}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "8px 8px 16px 8px" }} className="custom-scroll">
        {filteredSortedGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Empty 
              description={hasActiveFilters ? 'No steps match your filters' : 'No steps available'}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              {hasActiveFilters && (
                <Button type="primary" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </Empty>
          </div>
        ) : (
          filteredSortedGroups.map((groupNum, groupIndex) => {
            const groupSteps = filteredGroupedSteps[groupNum];
          const timeRange = getGroupTimeRange(groupSteps);
          const groupTags = getGroupTags(groupSteps);
          
          const isExpanded = expandedGroups.has(groupNum); // 기본적으로 모든 그룹이 접혀있음
          
          return (
            <div key={groupNum} style={{ marginBottom: "16px" }}>
              <Collapse
                ghost
                size="small"
                activeKey={isExpanded ? [groupNum] : []}
                onChange={() => toggleGroup(groupNum)}
                style={{
                  background: "transparent",
                  border: "none"
                }}
                items={[
                  {
                    key: groupNum,
                    label: (
                      <div className="ant-collapse-header-text">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <Avatar
                            size="small"
                            icon={<GroupOutlined />}
                            style={{ backgroundColor: "#1890ff", border: "none" }}
                          />
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <Text strong style={{ color: isDarkMode ? "#fff" : "#000", fontSize: "14px", lineHeight: "1.2" }}>
                              Group {groupNum}
                            </Text>
                            <Text type="secondary" style={{ fontSize: "11px", lineHeight: "1.2" }}>
                              {groupSteps.length} steps • {timeRange.start} - {timeRange.end}
                            </Text>
                          </div>
                        </div>
                      </div>
                    ),
                    children: (
                      <div style={{ marginTop: "8px" }}>
                        {groupTags.length > 0 && (
                          <div style={{ marginBottom: "12px" }}>
                            <Space size={4} wrap>
                              {groupTags.slice(0, 8).map((tag) => (
                                <Tag key={tag} color="cyan" style={{ fontSize: "10px", padding: '2px 6px' }}>
                                  {tag}
                                </Tag>
                              ))}
                              {groupTags.length > 8 && (
                                <Tag color="default" style={{ fontSize: "10px", padding: '2px 6px' }}>
                                  +{groupTags.length - 8} more
                                </Tag>
                              )}
                            </Space>
                          </div>
                        )}
                        <List
                  dataSource={groupSteps}
                  renderItem={(step) => {
                  const isSelected = selectedStep === step.stepIndex;
                  return (
                    <List.Item style={{ padding: "4px 0" }}>
                      <Card
                        size="small"
                        hoverable
                        onClick={() => onStepSelect(step.stepIndex)}
                        style={{
                          width: "100%",
                          borderColor: isSelected ? getStepColor(step.type) : undefined,
                          backgroundColor: isSelected 
                            ? (isDarkMode ? "#2a2a2a" : "#f6f6f6")
                            : (isDarkMode ? "#1f1f1f" : "#fff"),
                          boxShadow: isSelected ? `0 0 0 2px ${getStepColor(step.type)}20` : undefined,
                        }}
                        bodyStyle={{ padding: "12px" }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                          <Avatar
                            size="small"
                            icon={getStepIcon(step.type)}
                            style={{ backgroundColor: getStepColor(step.type) }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <Space size={4}>
                                <Text strong style={{ color: isDarkMode ? "#fff" : "#000" }}>
                                  Step {step.stepIndex}
                                </Text>
                                {step.replayOf && (
                                  <Tag color="orange" size="small" icon={<HistoryOutlined />}>
                                    Replay
                                  </Tag>
                                )}
                              </Space>
                              <Tag color={getTagColor(step.type)} style={{ fontSize: "11px", padding: '2px 6px' }}>
                                {step.type}
                              </Tag>
                            </div>
                            
                            {/* Custom Step Title */}
                            {step.title && (
                              <Text 
                                style={{ 
                                  fontSize: "13px", 
                                  display: "block", 
                                  marginBottom: "4px",
                                  color: isDarkMode ? "#fff" : "#000",
                                  fontWeight: 500
                                }}
                              >
                                {step.title}
                              </Text>
                            )}
                            
                            <Text 
                              type="secondary" 
                              style={{ 
                                fontSize: "12px", 
                                display: "block", 
                                marginBottom: "4px",
                                fontFamily: "monospace"
                              }}
                            >
                              {getStepPreview(step)}
                            </Text>
                            
                            {/* Step Tags */}
                            {step.tags && step.tags.length > 0 && (
                              <div style={{ marginBottom: "4px" }}>
                                <Space size={2} wrap>
                                  {step.tags.map((tag) => (
                                    <Tag key={tag} color="default" style={{ fontSize: "10px", padding: '1px 4px' }}>
                                      {tag}
                                    </Tag>
                                  ))}
                                </Space>
                              </div>
                            )}
                            
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Text type="secondary" style={{ fontSize: "11px" }}>
                                {new Date(step.timestamp).toLocaleTimeString()}
                              </Text>
                              {isSelected && (
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: getStepColor(step.type),
                                    animation: "pulse 1.5s infinite",
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </List.Item>
                  );
                }}
                        />
                      </div>
                    )
                  }
                ]}
              />
              
              {/* Group Divider */}
              {groupIndex < filteredSortedGroups.length - 1 && (
                <Divider style={{ margin: "16px 0", borderColor: isDarkMode ? "#434343" : "#d9d9d9" }} />
              )}
            </div>
          );
        })
        )}
      </div>
    </div>
  );
};

export default StepList;
