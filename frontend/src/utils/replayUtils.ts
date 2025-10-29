import type { Session, Step, PromptStep, CommandStep, FileEditStep, SessionComparison, StepComparison, ComparisonSummary } from '../types/index';

// Generate unique session ID for replay
export const generateReplaySessionId = (originalSessionId: string): string => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '');
  return `${originalSessionId}-replay-${timestamp}`;
};

// Create a new replay session from a specific step
export const createReplaySession = async (
  originalSession: Session,
  fromStepIndex: number,
  mockExecuteStep: (step: Step) => Promise<Step>
): Promise<Session> => {
  console.log(`Starting replay from step ${fromStepIndex} for session ${originalSession.sessionId}`);
  
  // Find the group that contains the fromStepIndex
  const fromStep = originalSession.steps.find(s => s.stepIndex === fromStepIndex);
  if (!fromStep) {
    throw new Error(`Step ${fromStepIndex} not found in original session`);
  }
  
  const targetGroup = fromStep.group;
  console.log(`Target group: ${targetGroup}`);
  
  // Copy steps up to and including the target group (unchanged)
  const unchangedSteps = originalSession.steps
    .filter(step => step.group <= targetGroup)
    .map(step => ({ ...step }));

  console.log(`Unchanged steps: ${unchangedSteps.length} (groups 1-${targetGroup})`);

  // Find if there are steps to replay (only within the same group as fromStep)
  const stepsToReplayInSameGroup = originalSession.steps
    .filter(step => step.group === targetGroup && step.stepIndex > fromStepIndex)
    .sort((a, b) => a.stepIndex - b.stepIndex);

  console.log(`Steps to replay in same group: ${stepsToReplayInSameGroup.length}`);

  const replayedSteps: Step[] = [];
  
  // Re-execute only steps within the same group
  for (const originalStep of stepsToReplayInSameGroup) {
    console.log(`Replaying step ${originalStep.stepIndex} (${originalStep.type}) in group ${originalStep.group}`);
    try {
      // Mock execution with potential different results
      const replayedStep = await mockExecuteStep(originalStep);
      replayedSteps.push({
        ...replayedStep,
        replayOf: originalStep.stepIndex,
        timestamp: new Date().toISOString(),
      });
      console.log(`Successfully replayed step ${originalStep.stepIndex}`);
    } catch (error) {
      console.error(`Failed to replay step ${originalStep.stepIndex}:`, error);
      // On error, we might want to stop the replay or create an error step
      break;
    }
  }
  
  // Note: We do NOT include steps from groups > targetGroup
  // because those represent subsequent user prompts that haven't been made yet

  // Create new replay session
  const replaySessionId = generateReplaySessionId(originalSession.sessionId);
  console.log(`Creating replay session with ID: ${replaySessionId}`);
  
  const replaySession: Session = {
    sessionId: replaySessionId,
    title: `Replay of ${originalSession.title}`,
    createdAt: new Date().toISOString(),
    steps: [...unchangedSteps, ...replayedSteps],
    replayOf: originalSession.sessionId,
    replayFromStepIndex: fromStepIndex,
    isReplaySession: true,
  };

  console.log(`Replay session created successfully with ${replaySession.steps.length} steps`);
  return replaySession;
};

// Mock LLM execution for different step types
export const mockExecuteStep = async (step: Step): Promise<Step> => {
  console.log(`Starting mock execution for step ${step.stepIndex} (${step.type})`);
  
  // Simulate execution delay (reduced for testing - set to 0 for immediate testing)
  await new Promise(resolve => setTimeout(resolve, 0));

  let result: Step;
  switch (step.type) {
    case 'prompt':
      result = await mockExecutePromptStep(step as PromptStep);
      break;
    case 'command':
      result = await mockExecuteCommandStep(step as CommandStep);
      break;
    case 'file_edit':
      result = await mockExecuteFileEditStep(step as FileEditStep);
      break;
    default:
      result = step;
  }
  
  console.log(`Completed mock execution for step ${step.stepIndex}`);
  return result;
};

const mockExecutePromptStep = async (step: PromptStep): Promise<PromptStep> => {
  // Generate more realistic variations based on the original response
  const originalResponse = step.data.response;
  
  // Different types of realistic variations
  const variationTypes = [
    'alternative_implementation',
    'improved_solution',
    'different_approach',
    'optimized_version',
    'enhanced_features'
  ];
  
  const variationType = variationTypes[Math.floor(Math.random() * variationTypes.length)];
  
  let newResponse = '';
  
  // Check if original response contains code
  const hasCode = originalResponse.includes('```') || originalResponse.includes('function') || originalResponse.includes('class');
  
  if (hasCode) {
    // Generate code-related variations
    switch (variationType) {
      case 'alternative_implementation':
        newResponse = generateAlternativeImplementation(originalResponse);
        break;
      case 'improved_solution':
        newResponse = generateImprovedSolution(originalResponse);
        break;
      case 'optimized_version':
        newResponse = generateOptimizedVersion(originalResponse);
        break;
      default:
        newResponse = generateDifferentApproach(originalResponse);
    }
  } else {
    // Generate text-based variations
    newResponse = generateTextVariation(originalResponse, variationType);
  }
  
  return {
    ...step,
    data: {
      ...step.data,
      response: newResponse,
    },
  };
};

const generateAlternativeImplementation = (original: string): string => {
  const alternatives = [
    `${original}\n\n**🔄 Replay Variation:**\nHere's an alternative implementation using a different approach:\n\n\`\`\`typescript\n// Alternative approach with better error handling\ninterface ReplayResult {\n  success: boolean;\n  data?: any;\n  error?: string;\n}\n\nasync function alternativeImplementation(): Promise<ReplayResult> {\n  try {\n    const result = await processWithRetry();\n    return { success: true, data: result };\n  } catch (error) {\n    return { success: false, error: error.message };\n  }\n}\n\`\`\`\n\nThis version includes:\n- Better type safety\n- Improved error handling\n- More robust retry logic`,
    
    `${original}\n\n**🔄 Replay Variation:**\nLet me suggest a different architectural approach:\n\n\`\`\`typescript\n// Using functional programming approach\nconst processData = (data: any[]) => \n  data\n    .filter(item => item.isValid)\n    .map(transform)\n    .reduce(aggregate, initialValue);\n\n// More composable and testable\nconst transform = (item: any) => ({ ...item, processed: true });\nconst aggregate = (acc: any, curr: any) => ({ ...acc, ...curr });\n\`\`\`\n\nThis functional approach offers:\n- Better composability\n- Easier testing\n- More predictable behavior`
  ];
  
  return alternatives[Math.floor(Math.random() * alternatives.length)];
};

const generateImprovedSolution = (original: string): string => {
  return `${original}\n\n**✨ Replay Enhancement:**\nHere's an improved version with additional optimizations:\n\n\`\`\`typescript\n// Enhanced with performance optimizations\nimport { memo, useMemo, useCallback } from 'react';\n\nconst OptimizedComponent = memo(({ data }: Props) => {\n  const processedData = useMemo(() => {\n    return data.map(item => ({ \n      ...item, \n      computed: expensiveCalculation(item) \n    }));\n  }, [data]);\n  \n  const handleClick = useCallback((id: string) => {\n    // Optimized event handler\n    updateItem(id);\n  }, []);\n  \n  return (\n    <div>\n      {processedData.map(item => (\n        <Item key={item.id} data={item} onClick={handleClick} />\n      ))}\n    </div>\n  );\n});\n\`\`\`\n\n**Improvements:**\n- React.memo for component memoization\n- useMemo for expensive calculations\n- useCallback for stable event handlers\n- Better performance with large datasets`;
};

const generateOptimizedVersion = (original: string): string => {
  return `${original}\n\n**⚡ Replay Optimization:**\nOptimized version focusing on performance:\n\n\`\`\`typescript\n// Performance-optimized implementation\nclass OptimizedProcessor {\n  private cache = new Map<string, any>();\n  \n  async processWithCaching(key: string, data: any) {\n    if (this.cache.has(key)) {\n      return this.cache.get(key);\n    }\n    \n    const result = await this.process(data);\n    this.cache.set(key, result);\n    return result;\n  }\n  \n  // Batch processing for better performance\n  async processBatch(items: any[]) {\n    const chunks = this.chunkArray(items, 100);\n    const results = await Promise.all(\n      chunks.map(chunk => this.processChunk(chunk))\n    );\n    return results.flat();\n  }\n  \n  private chunkArray<T>(array: T[], size: number): T[][] {\n    return Array.from({ length: Math.ceil(array.length / size) }, \n      (_, i) => array.slice(i * size, i * size + size)\n    );\n  }\n}\n\`\`\`\n\n**Optimizations:**\n- Caching for repeated operations\n- Batch processing for large datasets\n- Memory-efficient chunking\n- Async processing with Promise.all`;
};

const generateDifferentApproach = (original: string): string => {
  return `${original}\n\n**🎯 Replay Alternative:**\nDifferent approach using modern patterns:\n\n\`\`\`typescript\n// Using composition over inheritance\ninterface Processor {\n  process(data: any): Promise<any>;\n}\n\nclass ValidationProcessor implements Processor {\n  async process(data: any) {\n    if (!this.isValid(data)) {\n      throw new Error('Invalid data');\n    }\n    return data;\n  }\n  \n  private isValid(data: any): boolean {\n    return data && typeof data === 'object';\n  }\n}\n\nclass TransformProcessor implements Processor {\n  async process(data: any) {\n    return {\n      ...data,\n      timestamp: new Date().toISOString(),\n      version: '2.0'\n    };\n  }\n}\n\n// Compose processors\nconst pipeline = new ProcessorPipeline([\n  new ValidationProcessor(),\n  new TransformProcessor(),\n  new SaveProcessor()\n]);\n\`\`\`\n\n**Benefits:**\n- Modular design\n- Easy to test individual components\n- Flexible pipeline composition\n- Better separation of concerns`;
};

const generateTextVariation = (original: string, variationType: string): string => {
  const variations = {
    alternative_implementation: `${original}\n\n**🔄 Alternative Approach:**\nAfter reconsidering the requirements, here's a different strategy that might be more effective:\n\n• Focus on user experience first, then optimize performance\n• Use progressive enhancement instead of a complete rewrite\n• Implement feature flags for gradual rollout\n• Consider backward compatibility with existing systems\n\nThis approach reduces risk while still achieving the desired improvements.`,
    
    improved_solution: `${original}\n\n**✨ Enhanced Solution:**\nBuilding on the previous analysis, here are additional considerations:\n\n• **Security**: Implement proper input validation and sanitization\n• **Scalability**: Design for horizontal scaling from the start\n• **Monitoring**: Add comprehensive logging and metrics\n• **Documentation**: Maintain up-to-date API documentation\n• **Testing**: Include integration and end-to-end tests\n\nThese additions will create a more robust and maintainable solution.`,
    
    different_approach: `${original}\n\n**🎯 Different Perspective:**\nLooking at this from a different angle, we might want to consider:\n\n1. **User-Centric Design**: Start with user needs rather than technical requirements\n2. **Iterative Development**: Build MVP first, then enhance based on feedback\n3. **Data-Driven Decisions**: Use analytics to guide feature development\n4. **Cross-Platform Compatibility**: Ensure solution works across all target devices\n\nThis user-first approach often leads to better adoption and success metrics.`,
    
    optimized_version: `${original}\n\n**⚡ Optimized Strategy:**\nHere's a more efficient approach to achieve the same goals:\n\n• **Automation**: Reduce manual processes through intelligent automation\n• **Caching**: Implement smart caching strategies to improve response times\n• **Lazy Loading**: Load resources only when needed\n• **Compression**: Use appropriate compression for data transfer\n• **CDN**: Leverage content delivery networks for global performance\n\nThese optimizations can significantly improve system performance and user satisfaction.`,
    
    enhanced_features: `${original}\n\n**🚀 Feature Enhancement:**\nExpanding on the core functionality with additional features:\n\n• **Real-time Updates**: WebSocket integration for live data\n• **Offline Support**: Service worker implementation for offline functionality\n• **Personalization**: AI-powered recommendations based on user behavior\n• **Accessibility**: Full WCAG compliance for inclusive design\n• **Internationalization**: Multi-language and RTL support\n\nThese enhancements will provide a more comprehensive and inclusive user experience.`
  };
  
  return variations[variationType as keyof typeof variations] || original;
};

const mockExecuteCommandStep = async (step: CommandStep): Promise<CommandStep> => {
  const command = step.data.command;
  const originalStdout = step.data.stdout;
  
  // Generate realistic command variations based on command type
  let newStdout = originalStdout;
  let newStderr = step.data.stderr;
  let newExitCode = step.data.exitCode;
  
  if (command.includes('npm install') || command.includes('yarn install')) {
    // Package installation variations
    const variations = [
      {
        stdout: originalStdout.replace(/(\d+) packages?/g, (match, num) => `${parseInt(num) + Math.floor(Math.random() * 3)} packages`) + 
                "\n\n🔄 Replay differences:\n• Updated package-lock.json\n• Different registry response times\n• Some packages had newer patch versions available",
        stderr: newStderr,
        exitCode: 0
      },
      {
        stdout: originalStdout + "\n\n🔄 Replay variation:\n• Packages installed from cache\n• Faster installation due to cached dependencies\n• No network requests required",
        stderr: newStderr,
        exitCode: 0
      }
    ];
    const variation = variations[Math.floor(Math.random() * variations.length)];
    return { ...step, data: { ...step.data, ...variation } };
  }
  
  if (command.includes('npm run build') || command.includes('yarn build')) {
    // Build command variations
    const variations = [
      {
        stdout: originalStdout.replace(/(\d+\.?\d*)\s*(s|ms)/g, (match, time, unit) => {
          const newTime = unit === 's' ? 
            (parseFloat(time) + (Math.random() - 0.5) * 0.5).toFixed(2) :
            (parseFloat(time) + (Math.random() - 0.5) * 100).toFixed(0);
          return `${newTime} ${unit}`;
        }) + "\n\n🔄 Replay differences:\n• Different compilation times due to system load\n• Some TypeScript checks were cached\n• Bundle size slightly different due to dependency updates",
        stderr: newStderr,
        exitCode: 0
      }
    ];
    const variation = variations[Math.floor(Math.random() * variations.length)];
    return { ...step, data: { ...step.data, ...variation } };
  }
  
  if (command.includes('test') || command.includes('jest') || command.includes('vitest')) {
    // Test command variations
    const variations = [
      {
        stdout: originalStdout.replace(/(\d+) passing/g, (match, num) => `${num} passing`) +
                "\n\n🔄 Replay differences:\n• Test execution order slightly different\n• Some async tests had different timing\n• Coverage report shows minor variations",
        stderr: newStderr,
        exitCode: 0
      },
      {
        stdout: originalStdout.replace(/(\d+\.?\d*)(ms|s)/g, (match, time, unit) => {
          const newTime = parseFloat(time) + (Math.random() - 0.5) * parseFloat(time) * 0.2;
          return `${newTime.toFixed(unit === 'ms' ? 0 : 2)}${unit}`;
        }) + "\n\n🔄 Replay note: Test timing variations due to system performance",
        stderr: newStderr,
        exitCode: 0
      }
    ];
    const variation = variations[Math.floor(Math.random() * variations.length)];
    return { ...step, data: { ...step.data, ...variation } };
  }
  
  if (command.includes('git')) {
    // Git command variations
    if (command.includes('git status')) {
      newStdout = originalStdout + "\n\n🔄 Replay note: Repository state unchanged";
    } else if (command.includes('git log')) {
      newStdout = originalStdout + "\n\n🔄 Replay variation: Same commit history, different display timing";
    }
    return { ...step, data: { ...step.data, stdout: newStdout, stderr: newStderr, exitCode: newExitCode } };
  }
  
  // Generic command variations
  const genericVariations = [
    {
      stdout: originalStdout + "\n\n🔄 Replay execution completed with same results",
      stderr: newStderr,
      exitCode: newExitCode
    },
    {
      stdout: originalStdout.replace(/(\d+)/g, (match) => {
        const num = parseInt(match);
        return String(num + Math.floor(Math.random() * 3));
      }) + "\n\n🔄 Replay note: Minor numerical variations due to system state",
      stderr: newStderr,
      exitCode: newExitCode
    },
    {
      stdout: originalStdout,
      stderr: (newStderr ? newStderr + "\n" : "") + "🔄 Replay warning: Execution environment may differ slightly",
      exitCode: newExitCode
    }
  ];
  
  const variation = genericVariations[Math.floor(Math.random() * genericVariations.length)];
  return { ...step, data: { ...step.data, ...variation } };
};

const mockExecuteFileEditStep = async (step: FileEditStep): Promise<FileEditStep> => {
  const originalContent = step.data.content;
  const filePath = step.data.path;
  const action = step.data.action;
  
  let modifiedContent = originalContent;
  
  // Generate realistic file content variations based on file type and action
  const fileExtension = filePath.split('.').pop()?.toLowerCase();
  
  if (action === 'create' || action === 'update') {
    if (fileExtension === 'ts' || fileExtension === 'tsx' || fileExtension === 'js' || fileExtension === 'jsx') {
      // TypeScript/JavaScript file variations
      modifiedContent = generateCodeFileVariation(originalContent, fileExtension);
    } else if (fileExtension === 'json') {
      // JSON file variations
      modifiedContent = generateJsonFileVariation(originalContent);
    } else if (fileExtension === 'md') {
      // Markdown file variations
      modifiedContent = generateMarkdownFileVariation(originalContent);
    } else if (fileExtension === 'css' || fileExtension === 'scss') {
      // CSS file variations
      modifiedContent = generateCssFileVariation(originalContent);
    } else {
      // Generic text file variations
      modifiedContent = generateGenericFileVariation(originalContent);
    }
  }

  return {
    ...step,
    data: {
      ...step.data,
      content: modifiedContent,
    },
  };
};

const generateCodeFileVariation = (original: string, extension: string): string => {
  const variations = [
    // Add improved error handling
    original.replace(
      /(function|const \w+ = |export const \w+ = )/,
      `$1// 🔄 Replay: Enhanced with better error handling\n$1`
    ) + '\n\n// 🔄 Replay additions:\n// - Added input validation\n// - Improved error messages\n// - Better TypeScript types',
    
    // Add performance optimizations
    original.replace(
      /(import .* from .*)(\n)/g,
      '$1$2// 🔄 Replay: Optimized imports for better tree-shaking\n'
    ) + '\n\n// 🔄 Replay optimizations:\n// - Optimized bundle size\n// - Improved loading performance\n// - Better code splitting',
    
    // Add modern features
    original + '\n\n// 🔄 Replay enhancements:\n// - Added React.memo for performance\n// - Implemented proper TypeScript generics\n// - Enhanced accessibility features\n// - Added comprehensive unit tests',
    
    // Add documentation and comments
    original.replace(
      /(\/\/ .*)|(\/\*[\s\S]*?\*\/)/g,
      '$&\n// 🔄 Replay: Enhanced documentation'
    ) + '\n\n/**\n * 🔄 Replay improvements:\n * - Added comprehensive JSDoc comments\n * - Improved code readability\n * - Enhanced type definitions\n * - Better API documentation\n */'
  ];
  
  return variations[Math.floor(Math.random() * variations.length)];
};

const generateJsonFileVariation = (original: string): string => {
  try {
    const parsed = JSON.parse(original);
    
    const variations = [
      // Add metadata
      JSON.stringify({
        ...parsed,
        '_replayMetadata': {
          generatedAt: new Date().toISOString(),
          variation: 'enhanced',
          improvements: ['better structure', 'added validation', 'improved performance']
        }
      }, null, 2),
      
      // Update version
      JSON.stringify({
        ...parsed,
        version: parsed.version ? `${parsed.version}-replay` : '1.0.0-replay',
        lastModified: new Date().toISOString()
      }, null, 2),
      
      // Add development dependencies (if package.json)
      parsed.devDependencies ? JSON.stringify({
        ...parsed,
        devDependencies: {
          ...parsed.devDependencies,
          '@types/jest': '^29.0.0',
          'eslint-plugin-replay': '^1.0.0'
        }
      }, null, 2) : original
    ];
    
    return variations[Math.floor(Math.random() * variations.length)];
  } catch {
    return original + '\n\n// 🔄 Replay note: JSON structure preserved with minor formatting improvements';
  }
};

const generateMarkdownFileVariation = (original: string): string => {
  const variations = [
    original + '\n\n## 🔄 Replay Enhancements\n\n- Enhanced documentation structure\n- Added code examples\n- Improved readability\n- Better organization\n\n> Generated during replay execution',
    
    original.replace(
      /^(# .*)$/m,
      '$1\n\n> 🔄 This document was enhanced during replay execution'
    ) + '\n\n### Additional Notes\n\n- Updated examples\n- Improved formatting\n- Enhanced clarity',
    
    original + '\n\n---\n\n**🔄 Replay Improvements:**\n\n1. Better structure and organization\n2. Enhanced code examples\n3. Improved cross-references\n4. Updated best practices\n\n*Document enhanced during replay process*'
  ];
  
  return variations[Math.floor(Math.random() * variations.length)];
};

const generateCssFileVariation = (original: string): string => {
  const variations = [
    original + '\n\n/* 🔄 Replay enhancements */\n.replay-enhanced {\n  /* Improved performance */\n  will-change: transform;\n  transform: translateZ(0);\n  \n  /* Better accessibility */\n  @media (prefers-reduced-motion: reduce) {\n    animation: none;\n  }\n}',
    
    original.replace(
      /(\/\* .* \*\/)/g,
      '$1\n/* 🔄 Replay: Enhanced with modern CSS features */'
    ) + '\n\n/* 🔄 Replay additions: Modern CSS Grid and Flexbox optimizations */\n:root {\n  --replay-spacing: 1rem;\n  --replay-border-radius: 0.5rem;\n}',
    
    original + '\n\n/* 🔄 Replay improvements */\n@supports (display: grid) {\n  .container {\n    display: grid;\n    gap: var(--grid-gap, 1rem);\n  }\n}\n\n/* Enhanced dark mode support */\n@media (prefers-color-scheme: dark) {\n  /* Dark mode optimizations added during replay */\n}'
  ];
  
  return variations[Math.floor(Math.random() * variations.length)];
};

const generateGenericFileVariation = (original: string): string => {
  const variations = [
    `# 🔄 Replay Enhanced Version\n# Generated at: ${new Date().toISOString()}\n\n${original}\n\n# 🔄 Replay additions:\n# - Enhanced configuration\n# - Improved settings\n# - Better organization`,
    
    original + `\n\n# 🔄 Replay modifications:\n# - Updated for better performance\n# - Enhanced error handling\n# - Improved maintainability\n# Last modified: ${new Date().toISOString()}`,
    
    original.split('\n').map(line => 
      line.startsWith('#') ? line : `${line} # 🔄 Enhanced`
    ).join('\n') + '\n\n# 🔄 File enhanced during replay execution'
  ];
  
  return variations[Math.floor(Math.random() * variations.length)];
};

// Compare two sessions and generate comparison data
export const compareSessions = (originalSession: Session, replaySession: Session): SessionComparison => {
  const stepComparisons: StepComparison[] = [];
  
  // Get all unique step indices
  const allStepIndices = new Set([
    ...originalSession.steps.map(s => s.stepIndex),
    ...replaySession.steps.map(s => s.stepIndex),
  ]);

  for (const stepIndex of Array.from(allStepIndices).sort((a, b) => a - b)) {
    const originalStep = originalSession.steps.find(s => s.stepIndex === stepIndex);
    const replayStep = replaySession.steps.find(s => s.stepIndex === stepIndex);

    let status: StepComparison['status'];
    let differences: string[] = [];

    if (originalStep && replayStep) {
      const stepDifferences = compareSteps(originalStep, replayStep);
      status = stepDifferences.length > 0 ? 'modified' : 'identical';
      differences = stepDifferences;
    } else if (originalStep && !replayStep) {
      status = 'removed';
      differences = ['Step was removed in replay'];
    } else if (!originalStep && replayStep) {
      status = 'added';
      differences = ['Step was added in replay'];
    } else {
      status = 'identical'; // This shouldn't happen
    }

    stepComparisons.push({
      stepIndex,
      originalStep,
      replayStep,
      status,
      differences,
    });
  }

  const summary: ComparisonSummary = {
    totalStepsOriginal: originalSession.steps.length,
    totalStepsReplay: replaySession.steps.length,
    identicalSteps: stepComparisons.filter(sc => sc.status === 'identical').length,
    modifiedSteps: stepComparisons.filter(sc => sc.status === 'modified').length,
    addedSteps: stepComparisons.filter(sc => sc.status === 'added').length,
    removedSteps: stepComparisons.filter(sc => sc.status === 'removed').length,
  };

  return {
    originalSession,
    replaySession,
    stepComparisons,
    summary,
  };
};

// Compare individual steps and return differences
const compareSteps = (originalStep: Step, replayStep: Step): string[] => {
  const differences: string[] = [];

  if (originalStep.type !== replayStep.type) {
    differences.push(`Type changed from ${originalStep.type} to ${replayStep.type}`);
    return differences; // If types are different, no point in comparing data
  }

  switch (originalStep.type) {
    case 'prompt':
      const originalPrompt = originalStep as PromptStep;
      const replayPrompt = replayStep as PromptStep;
      
      if (originalPrompt.data.prompt !== replayPrompt.data.prompt) {
        differences.push('Prompt input changed');
      }
      if (originalPrompt.data.response !== replayPrompt.data.response) {
        differences.push('Response output changed');
      }
      break;

    case 'command':
      const originalCommand = originalStep as CommandStep;
      const replayCommand = replayStep as CommandStep;
      
      if (originalCommand.data.command !== replayCommand.data.command) {
        differences.push('Command changed');
      }
      if (originalCommand.data.stdout !== replayCommand.data.stdout) {
        differences.push('Standard output changed');
      }
      if (originalCommand.data.stderr !== replayCommand.data.stderr) {
        differences.push('Standard error changed');
      }
      if (originalCommand.data.exitCode !== replayCommand.data.exitCode) {
        differences.push(`Exit code changed from ${originalCommand.data.exitCode} to ${replayCommand.data.exitCode}`);
      }
      break;

    case 'file_edit':
      const originalFile = originalStep as FileEditStep;
      const replayFile = replayStep as FileEditStep;
      
      if (originalFile.data.path !== replayFile.data.path) {
        differences.push('File path changed');
      }
      if (originalFile.data.action !== replayFile.data.action) {
        differences.push(`Action changed from ${originalFile.data.action} to ${replayFile.data.action}`);
      }
      if (originalFile.data.content !== replayFile.data.content) {
        differences.push('File content changed');
      }
      break;
  }

  return differences;
};