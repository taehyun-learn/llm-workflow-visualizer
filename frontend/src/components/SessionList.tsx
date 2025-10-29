import React from "react";
import { List, Card, Tag, Typography, Space, Avatar, Button, Empty } from "antd";
import { 
  PlayCircleOutlined, 
  CalendarOutlined, 
  FileTextOutlined,
  TagOutlined,
  ArrowRightOutlined,
  BranchesOutlined,
  LinkOutlined
} from "@ant-design/icons";
import type { SessionSummary, Session } from "../types/index";

const { Title, Text } = Typography;

interface SessionListProps {
  sessions: SessionSummary[];
  onSessionSelect: (sessionId: string) => void;
  onCompareSession?: (originalSessionId: string, replaySessionId: string) => void;
  isDarkMode: boolean;
}

const SessionList: React.FC<SessionListProps> = ({ 
  sessions, 
  onSessionSelect, 
  onCompareSession,
  isDarkMode 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 48) return "하루 전";
    return `${Math.floor(diffInHours / 24)}일 전`;
  };

  const isReplaySession = (session: SessionSummary) => {
    return session.isReplaySession || session.replayOf;
  };

  const getOriginalSession = (replaySession: SessionSummary) => {
    return sessions.find(s => s.sessionId === replaySession.replayOf);
  };

  const getReplaySessions = (originalSessionId: string) => {
    return sessions.filter(s => s.replayOf === originalSessionId);
  };

  const headerStyle = {
    background: isDarkMode ? "#1f1f1f" : "#fafafa",
    borderBottom: `1px solid ${isDarkMode ? "#434343" : "#d9d9d9"}`,
    padding: "24px",
    textAlign: "center" as const,
  };

  if (sessions.length === 0) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={headerStyle}>
          <Title level={2} style={{ margin: 0, color: isDarkMode ? "#fff" : "#000" }}>
            🔍 LLM Workflow Sessions
          </Title>
          <Text type="secondary">
            Select a session to explore the workflow
          </Text>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No sessions available"
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={headerStyle}>
        <Title level={2} style={{ margin: 0, color: isDarkMode ? "#fff" : "#000" }}>
          🔍 LLM Workflow Sessions
        </Title>
        <Text type="secondary">
          {sessions.length} sessions available • Select one to explore
        </Text>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px" }} className="custom-scroll">
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <List
            grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }}
            dataSource={sessions}
            renderItem={(session) => (
              <List.Item>
                <Card
                  hoverable
                  onClick={() => onSessionSelect(session.sessionId)}
                  style={{
                    backgroundColor: isDarkMode ? "#1f1f1f" : "#fff",
                    borderColor: isDarkMode ? "#434343" : "#d9d9d9",
                    height: "100%",
                  }}
                  actions={[
                    <Button 
                      type="primary" 
                      icon={<ArrowRightOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSessionSelect(session.sessionId);
                      }}
                    >
                      세션 열기
                    </Button>,
                    ...(isReplaySession(session) && session.replayOf && onCompareSession ? [
                      <Button 
                        type="default"
                        icon={<LinkOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          onCompareSession!(session.replayOf!, session.sessionId);
                        }}
                      >
                        비교하기
                      </Button>
                    ] : [])
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <Avatar
                        size="large"
                        icon={isReplaySession(session) ? <BranchesOutlined /> : <PlayCircleOutlined />}
                        style={{ 
                          backgroundColor: isReplaySession(session) ? "#ff7a00" : "#1890ff" 
                        }}
                      />
                    }
                    title={
                      <Space direction="vertical" size={4} style={{ width: "100%" }}>
                        <Title level={4} style={{ margin: 0, color: isDarkMode ? "#fff" : "#000" }}>
                          {session.title}
                        </Title>
                        <Space size={8} style={{ flexWrap: 'wrap' }}>
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            {session.sessionId}
                          </Text>
                          {isReplaySession(session) && (
                            <Tag color="orange" size="small">
                              REPLAY
                            </Tag>
                          )}
                        </Space>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        {isReplaySession(session) && session.replayOf && (
                          <div>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              <BranchesOutlined style={{ marginRight: '4px' }} />
                              Replay of: {getOriginalSession(session)?.title || session.replayOf}
                            </Text>
                            {session.replayFromStepIndex && (
                              <Text type="secondary" style={{ fontSize: "11px", display: 'block', marginLeft: '16px' }}>
                                From step {session.replayFromStepIndex}
                              </Text>
                            )}
                          </div>
                        )}
                        <div>
                          <Space size={16}>
                            <Space size={4}>
                              <CalendarOutlined />
                              <Text type="secondary" style={{ fontSize: "12px" }}>
                                {formatDate(session.createdAt)}
                              </Text>
                            </Space>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {getRelativeTime(session.lastActivity)}
                            </Text>
                          </Space>
                        </div>
                        
                        <div>
                          <Space size={4}>
                            <FileTextOutlined />
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {session.stepCount} steps
                            </Text>
                          </Space>
                        </div>

                        <div>
                          <Space size={4} wrap>
                            <TagOutlined />
                            {isReplaySession(session) && (
                              <Tag color="orange" style={{ fontSize: '11px', padding: '2px 6px' }}>
                                replay
                              </Tag>
                            )}
                            {session.tags.slice(0, 2).map((tag) => (
                              <Tag key={tag} color="blue" style={{ fontSize: '11px', padding: '2px 6px' }}>
                                {tag}
                              </Tag>
                            ))}
                            {session.tags.length > 2 && (
                              <Tag color="default" style={{ fontSize: '11px', padding: '2px 6px' }}>
                                +{session.tags.length - 2}
                              </Tag>
                            )}
                          </Space>
                        </div>

                        {!isReplaySession(session) && getReplaySessions(session.sessionId).length > 0 && (
                          <div>
                            <Text type="secondary" style={{ fontSize: "11px" }}>
                              <LinkOutlined style={{ marginRight: '4px' }} />
                              {getReplaySessions(session.sessionId).length} replay sessions available
                            </Text>
                          </div>
                        )}
                      </Space>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionList;