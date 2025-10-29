export interface BaseStep {
  stepIndex: number;
  timestamp: string;
  group: number;
  title?: string;
  tags?: string[];
  replayOf?: number;
}

export interface PromptStep extends BaseStep {
  type: 'prompt';
  data: {
    prompt: string;
  };
}

export interface FileEditStep extends BaseStep {
  type: 'file_edit';
  data: {
    path: string;
    action: 'create' | 'update' | 'delete';
    content: string;
  };
}

export interface CommandStep extends BaseStep {
  type: 'command';
  data: {
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number;
  };
}

export interface AssistantResponseStep extends BaseStep {
  type: 'assistant_response';
  data: {
    response: string;
  };
}

export type Step = PromptStep | FileEditStep | CommandStep | AssistantResponseStep;

export interface Session {
  sessionId: string;
  title: string;
  createdAt: string;
  steps: Step[];
  // Replay metadata
  replayOf?: string;           // Original session ID
  replayFromStepIndex?: number; // Step index from which replay started
  isReplaySession?: boolean;   // Quick flag to identify replay sessions
}

export interface SessionSummary {
  sessionId: string;
  title: string;
  createdAt: string;
  stepCount: number;
  lastActivity: string;
  tags: string[];
  // Replay metadata
  replayOf?: string;
  replayFromStepIndex?: number;
  isReplaySession?: boolean;
}

export interface StepGroup {
  groupNumber: number;
  steps: Step[];
  startTime: string;
  endTime: string;
}

// New interfaces for session comparison
export interface SessionComparison {
  originalSession: Session;
  replaySession: Session;
  stepComparisons: StepComparison[];
  summary: ComparisonSummary;
}

export interface StepComparison {
  stepIndex: number;
  originalStep?: Step;
  replayStep?: Step;
  status: 'identical' | 'modified' | 'added' | 'removed';
  differences?: string[];
}

export interface ComparisonSummary {
  totalStepsOriginal: number;
  totalStepsReplay: number;
  identicalSteps: number;
  modifiedSteps: number;
  addedSteps: number;
  removedSteps: number;
}