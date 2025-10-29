import React, { useMemo, useRef, useCallback } from 'react';
import { Button, Space, Typography, Statistic } from 'antd';
import { CopyOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import * as Diff from 'diff';

const { Text } = Typography;

interface DiffViewerProps {
  oldValue: string;
  newValue: string;
  oldTitle?: string;
  newTitle?: string;
  isDarkMode?: boolean;
  onCopyOld?: () => void;
  onCopyNew?: () => void;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
  originalLineNumber?: number;
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  oldValue,
  newValue,
  oldTitle = 'Original',
  newTitle = 'Modified',
  isDarkMode = false,
  onCopyOld,
  onCopyNew,
}) => {
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((source: 'left' | 'right') => (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const other = source === 'left' ? rightScrollRef.current : leftScrollRef.current;
    
    if (other) {
      other.scrollTop = target.scrollTop;
    }
  }, []);

  const diffLines = useMemo(() => {
    const changes = Diff.diffLines(oldValue, newValue);
    const leftLines: DiffLine[] = [];
    const rightLines: DiffLine[] = [];
    
    let leftLineNum = 1;
    let rightLineNum = 1;

    changes.forEach((change) => {
      const lines = change.value.split('\n').filter((line, index, arr) => 
        index < arr.length - 1 || line !== ''
      );

      if (change.added) {
        // Added lines (only on right side)
        lines.forEach((line) => {
          leftLines.push({
            type: 'unchanged',
            content: '',
            lineNumber: 0,
          });
          rightLines.push({
            type: 'added',
            content: line,
            lineNumber: rightLineNum++,
          });
        });
      } else if (change.removed) {
        // Removed lines (only on left side)
        lines.forEach((line) => {
          leftLines.push({
            type: 'removed',
            content: line,
            lineNumber: leftLineNum++,
          });
          rightLines.push({
            type: 'unchanged',
            content: '',
            lineNumber: 0,
          });
        });
      } else {
        // Unchanged lines (on both sides)
        lines.forEach((line) => {
          leftLines.push({
            type: 'unchanged',
            content: line,
            lineNumber: leftLineNum++,
          });
          rightLines.push({
            type: 'unchanged',
            content: line,
            lineNumber: rightLineNum++,
          });
        });
      }
    });

    return { leftLines, rightLines };
  }, [oldValue, newValue]);

  const diffStats = useMemo(() => {
    const changes = Diff.diffLines(oldValue, newValue);
    let additions = 0;
    let deletions = 0;
    
    changes.forEach((change) => {
      const lineCount = change.value.split('\n').length - 1;
      if (change.added) {
        additions += lineCount;
      } else if (change.removed) {
        deletions += lineCount;
      }
    });
    
    return { additions, deletions };
  }, [oldValue, newValue]);

  const getLineStyle = (type: DiffLine['type']) => {
    const baseStyle: React.CSSProperties = {
      padding: '2px 8px',
      fontFamily: 'monospace',
      fontSize: '13px',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      minHeight: '20px',
      borderLeft: '3px solid transparent',
    };

    if (isDarkMode) {
      switch (type) {
        case 'added':
          return {
            ...baseStyle,
            backgroundColor: '#1a472a',
            borderLeftColor: '#22c55e',
            color: '#dcfce7',
          };
        case 'removed':
          return {
            ...baseStyle,
            backgroundColor: '#4c1d1d',
            borderLeftColor: '#ef4444',
            color: '#fecaca',
          };
        default:
          return {
            ...baseStyle,
            backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
            color: isDarkMode ? '#e5e5e5' : '#333',
          };
      }
    } else {
      switch (type) {
        case 'added':
          return {
            ...baseStyle,
            backgroundColor: '#dcfce7',
            borderLeftColor: '#22c55e',
            color: '#166534',
          };
        case 'removed':
          return {
            ...baseStyle,
            backgroundColor: '#fecaca',
            borderLeftColor: '#ef4444',
            color: '#991b1b',
          };
        default:
          return {
            ...baseStyle,
            backgroundColor: '#fff',
            color: '#333',
          };
      }
    }
  };

  const getLineNumberStyle = (type: DiffLine['type']) => {
    const baseStyle: React.CSSProperties = {
      width: '50px',
      textAlign: 'right',
      padding: '2px 8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      borderRight: `1px solid ${isDarkMode ? '#434343' : '#e5e5e5'}`,
      userSelect: 'none',
      flexShrink: 0,
    };

    if (isDarkMode) {
      return {
        ...baseStyle,
        backgroundColor: type === 'unchanged' ? '#262626' : 
                       type === 'added' ? '#1a472a' : '#4c1d1d',
        color: type === 'unchanged' ? '#8c8c8c' : '#fff',
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: type === 'unchanged' ? '#f5f5f5' : 
                       type === 'added' ? '#dcfce7' : '#fecaca',
        color: type === 'unchanged' ? '#666' : '#333',
      };
    }
  };

  const renderPane = (
    lines: DiffLine[], 
    title: string, 
    side: 'left' | 'right',
    onCopy?: () => void
  ) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${isDarkMode ? '#434343' : '#e5e5e5'}`,
          backgroundColor: isDarkMode ? '#262626' : '#f8f9fa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text strong style={{ color: isDarkMode ? '#fff' : '#000' }}>
          {title}
        </Text>
        {onCopy && (
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={onCopy}
          >
            Copy
          </Button>
        )}
      </div>

      {/* Content */}
      <div
        ref={side === 'left' ? leftScrollRef : rightScrollRef}
        onScroll={handleScroll(side)}
        style={{
          flex: 1,
          overflow: 'auto',
          backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
        }}
        className="custom-scroll"
      >
        {lines.map((line, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'stretch',
            }}
          >
            {/* Line number */}
            <div style={getLineNumberStyle(line.type)}>
              {line.lineNumber > 0 ? line.lineNumber : ''}
            </div>
            {/* Line content */}
            <div style={{ ...getLineStyle(line.type), flex: 1 }}>
              {line.content || '\u00A0'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      style={{
        border: `1px solid ${isDarkMode ? '#434343' : '#d9d9d9'}`,
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
      }}
    >
      {/* Stats Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${isDarkMode ? '#434343' : '#e5e5e5'}`,
          backgroundColor: isDarkMode ? '#262626' : '#f8f9fa',
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
        }}
      >
        <Statistic
          title="Additions"
          value={diffStats.additions}
          prefix={<PlusOutlined style={{ color: '#22c55e' }} />}
          valueStyle={{ color: '#22c55e', fontSize: '16px' }}
        />
        <Statistic
          title="Deletions"
          value={diffStats.deletions}
          prefix={<MinusOutlined style={{ color: '#ef4444' }} />}
          valueStyle={{ color: '#ef4444', fontSize: '16px' }}
        />
      </div>

      <div style={{ display: 'flex', height: '500px' }}>
        {renderPane(diffLines.leftLines, oldTitle, 'left', onCopyOld)}
        
        {/* Separator */}
        <div
          style={{
            width: '1px',
            backgroundColor: isDarkMode ? '#434343' : '#d9d9d9',
          }}
        />
        
        {renderPane(diffLines.rightLines, newTitle, 'right', onCopyNew)}
      </div>
    </div>
  );
};

export default DiffViewer;