/**
 * 自动化引擎协同中枢（Automation Orchestration Hub）
 *
 * 作用：
 *  - 统一调度 6 大自动化引擎（AI分析中心 / 区块链 / OpenClaw / n8n / AI大模型 / BPM）
 *  - 事件总线：跨引擎事件订阅与分发
 *  - 工作流编排：将多个引擎组合成自动化工作流
 *  - 任务队列：异步任务调度与重试
 *  - 运行监控：所有引擎运行状态、任务执行历史
 *  - 与管理员后台运作机制深度集成（审批、审计、权限）
 */

import { logger } from '@/lib/logger';
import { useAuthStore } from '@/stores/authStore';
import { createAuditLog } from './audit-log';
import {
  createApproval,
  type ApprovalType,
} from './approval-workflow';

export type AutomationEngineId =
  | 'ai-center'
  | 'blockchain'
  | 'openclaw'
  | 'n8n'
  | 'ai-llm'
  | 'bpm';

export const ENGINE_LABELS: Record<AutomationEngineId, string> = {
  'ai-center': 'AI分析中心',
  blockchain: '区块链',
  openclaw: 'OpenClaw智能体',
  n8n: 'n8n工作流',
  'ai-llm': 'AI大模型集成',
  bpm: 'BPM工作流引擎',
};

export const ENGINE_DESCRIPTIONS: Record<AutomationEngineId, string> = {
  'ai-center': '模型/知识库/风险预测/智能决策 - 提供AI分析能力',
  blockchain: '浏览器/节点/合约/存证链 - 提供链上数据与不可篡改存证',
  openclaw: '编排/市场/训练/监控 - 智能体执行复杂业务',
  n8n: '编辑器/模板/触发器/历史 - 业务自动化集成',
  'ai-llm': '模型管理/Prompt/推荐/成本分析 - 大语言模型能力输出',
  bpm: '建模/运行/监控/分析 - 业务流程编排引擎',
};

export const ENGINE_CAPABILITIES: Record<AutomationEngineId, string[]> = {
  'ai-center': ['风险预测', '智能决策', '知识图谱', '危害检测', '语音交互', '模型管理'],
  blockchain: ['链上查询', '智能合约', '存证', '节点管理', '区块浏览器'],
  openclaw: ['智能体编排', '市场对接', '模型训练', '运行监控'],
  n8n: ['工作流编辑', '触发器', '模板管理', '执行历史'],
  'ai-llm': ['Prompt工程', '模型推荐', '成本分析', '智能识别'],
  bpm: ['流程建模', '流程运行', '流程监控', '流程分析'],
};

export type EngineTaskStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'cancelled'
  | 'timeout'
  | 'waiting_approval';

export type AutomationEventType =
  | 'user.registered'
  | 'user.frozen'
  | 'user.unfrozen'
  | 'user.kyc.submitted'
  | 'user.kyc.approved'
  | 'user.kyc.rejected'
  | 'transaction.large.withdrawal'
  | 'transaction.large.deposit'
  | 'transaction.suspicious'
  | 'risk.alert'
  | 'risk.blocked'
  | 'order.placed'
  | 'order.filled'
  | 'order.cancelled'
  | 'token.listed'
  | 'token.delisted'
  | 'system.config.changed'
  | 'system.error'
  | 'security.breach'
  | 'approval.submitted'
  | 'approval.approved'
  | 'approval.rejected'
  | 'schedule.daily'
  | 'schedule.hourly'
  | 'manual.trigger';

export interface AutomationEvent {
  id: string;
  type: AutomationEventType;
  source: AutomationEngineId | 'admin' | 'user' | 'system';
  payload: Record<string, unknown>;
  timestamp: string;
  userId?: string;
}

export interface EngineTask {
  id: string;
  name: string;
  engine: AutomationEngineId;
  action: string;
  input: Record<string, unknown>;
  status: EngineTaskStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  triggerEventId?: string;
  workflowId?: string;
  approvalId?: string;
  result?: Record<string, unknown>;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  createdBy: string;
  scheduledAt?: string;
}

export interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: 'event' | 'schedule' | 'manual';
    eventType?: AutomationEventType;
    cron?: string;
  };
  steps: WorkflowStep[];
  enabled: boolean;
  approvalRequired: boolean;
  approvalType?: ApprovalType;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
}

export interface WorkflowStep {
  id: string;
  engine: AutomationEngineId;
  action: string;
  params: Record<string, unknown>;
  dependsOn?: string[];
  continueOnError?: boolean;
  timeout?: number;
}

export interface EngineStatus {
  engine: AutomationEngineId;
  status: 'online' | 'offline' | 'degraded' | 'maintenance';
  healthy: boolean;
  activeTasks: number;
  totalTasks: number;
  successRate: number;
  avgDuration: number;
  lastHeartbeat: string;
  version: string;
}

const TASKS_KEY = 'zs-automation-tasks';
const WORKFLOWS_KEY = 'zs-automation-workflows';
const EVENTS_KEY = 'zs-automation-events';
const ENGINE_STATUS_KEY = 'zs-engine-status';
const MAX_EVENTS = 500;
const MAX_TASKS = 200;

let inMemoryTasks: EngineTask[] = [];
let inMemoryWorkflows: AutomationWorkflow[] = [];
let inMemoryEvents: AutomationEvent[] = [];
let engineStatuses: Record<AutomationEngineId, EngineStatus> = {} as any;

type EventHandler = (event: AutomationEvent) => void | Promise<void>;
const eventHandlers: Map<AutomationEventType, EventHandler[]> = new Map();

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const loadFromStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    inMemoryTasks = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
    inMemoryWorkflows = JSON.parse(localStorage.getItem(WORKFLOWS_KEY) || '[]');
    inMemoryEvents = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    engineStatuses = JSON.parse(localStorage.getItem(ENGINE_STATUS_KEY) || '{}');
  } catch (e) {
    logger.error('[AutomationHub] 加载数据失败', e);
  }
};

const saveTasks = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(inMemoryTasks.slice(0, MAX_TASKS)));
  } catch (e) { logger.error('[AutomationHub] 保存任务失败', e); }
};

const saveWorkflows = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(inMemoryWorkflows));
  } catch (e) { logger.error('[AutomationHub] 保存工作流失败', e); }
};

const saveEvents = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(inMemoryEvents.slice(0, MAX_EVENTS)));
  } catch (e) { logger.error('[AutomationHub] 保存事件失败', e); }
};

const saveEngineStatuses = () => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ENGINE_STATUS_KEY, JSON.stringify(engineStatuses));
  } catch (e) { logger.error('[AutomationHub] 保存引擎状态失败', e); }
};

if (typeof window !== 'undefined') {
  loadFromStorage();
  seedDefaultWorkflows();
  seedEngineStatuses();
}

function seedDefaultWorkflows() {
  if (inMemoryWorkflows.length > 0) return;

  const defaults: AutomationWorkflow[] = [
    {
      id: generateId('wf'),
      name: '用户注册智能引导',
      description: '新用户注册后自动调用AI分析中心做风险评估，调用AI大模型生成个性化欢迎语',
      trigger: { type: 'event', eventType: 'user.registered' },
      steps: [
        {
          id: 'step-1',
          engine: 'ai-center',
          action: 'risk_assessment',
          params: { userId: '${event.payload.userId}' },
        },
        {
          id: 'step-2',
          engine: 'ai-llm',
          action: 'generate_welcome',
          params: { userId: '${event.payload.userId}' },
          dependsOn: ['step-1'],
        },
      ],
      enabled: true,
      approvalRequired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
    },
    {
      id: generateId('wf'),
      name: '大额提现风控审核',
      description: '检测到大额提现后，自动冻结账户并触发AI风控分析，结果上链存证',
      trigger: { type: 'event', eventType: 'transaction.large.withdrawal' },
      steps: [
        {
          id: 'step-1',
          engine: 'openclaw',
          action: 'freeze_account',
          params: { userId: '${event.payload.userId}', reason: '大额提现待审核' },
        },
        {
          id: 'step-2',
          engine: 'ai-center',
          action: 'risk_analysis',
          params: { userId: '${event.payload.userId}', amount: '${event.payload.amount}' },
          dependsOn: ['step-1'],
        },
        {
          id: 'step-3',
          engine: 'blockchain',
          action: 'evidence_store',
          params: { dataType: 'risk_analysis', refId: '${step-2.result.reportId}' },
          dependsOn: ['step-2'],
          continueOnError: true,
        },
        {
          id: 'step-4',
          engine: 'bpm',
          action: 'start_approval',
          params: {
            type: 'large_withdrawal',
            data: { userId: '${event.payload.userId}', amount: '${event.payload.amount}' },
          },
          dependsOn: ['step-2'],
        },
      ],
      enabled: true,
      approvalRequired: true,
      approvalType: 'large_withdrawal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
    },
    {
      id: generateId('wf'),
      name: '可疑交易智能阻断',
      description: '风控告警后由OpenClaw智能体执行阻断策略，AI大模型生成阻断说明，存证到区块链',
      trigger: { type: 'event', eventType: 'risk.alert' },
      steps: [
        {
          id: 'step-1',
          engine: 'ai-center',
          action: 'hazard_detection',
          params: { alertId: '${event.payload.alertId}' },
        },
        {
          id: 'step-2',
          engine: 'openclaw',
          action: 'block_transaction',
          params: { transactionId: '${event.payload.transactionId}' },
          dependsOn: ['step-1'],
        },
        {
          id: 'step-3',
          engine: 'ai-llm',
          action: 'generate_report',
          params: { alertId: '${event.payload.alertId}' },
          dependsOn: ['step-1'],
        },
        {
          id: 'step-4',
          engine: 'blockchain',
          action: 'evidence_store',
          params: { dataType: 'risk_block', data: '${step-3.result}' },
          dependsOn: ['step-2', 'step-3'],
        },
      ],
      enabled: true,
      approvalRequired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
    },
    {
      id: generateId('wf'),
      name: '代币上线全流程',
      description: '代币上线申请后，AI分析项目风险、BPM走审批流程、通过后存证上链、通知用户',
      trigger: { type: 'event', eventType: 'token.listed' },
      steps: [
        {
          id: 'step-1',
          engine: 'ai-center',
          action: 'token_risk_score',
          params: { tokenSymbol: '${event.payload.symbol}' },
        },
        {
          id: 'step-2',
          engine: 'bpm',
          action: 'start_approval',
          params: { type: 'token_listing', data: '${event.payload}' },
          dependsOn: ['step-1'],
        },
        {
          id: 'step-3',
          engine: 'blockchain',
          action: 'deploy_listing_contract',
          params: { symbol: '${event.payload.symbol}' },
          dependsOn: ['step-2'],
        },
        {
          id: 'step-4',
          engine: 'n8n',
          action: 'send_notification',
          params: { channel: 'all', template: 'token_listed', data: '${event.payload}' },
          dependsOn: ['step-3'],
        },
      ],
      enabled: true,
      approvalRequired: true,
      approvalType: 'token_listing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
    },
    {
      id: generateId('wf'),
      name: '系统配置变更审计',
      description: '系统配置变更后由n8n通知相关人员，AI大模型生成变更说明，关键变更上链存证',
      trigger: { type: 'event', eventType: 'system.config.changed' },
      steps: [
        {
          id: 'step-1',
          engine: 'ai-llm',
          action: 'generate_change_summary',
          params: { changeData: '${event.payload}' },
        },
        {
          id: 'step-2',
          engine: 'n8n',
          action: 'send_notification',
          params: { channel: 'admin', template: 'config_change', data: '${event.payload}' },
          dependsOn: ['step-1'],
        },
        {
          id: 'step-3',
          engine: 'blockchain',
          action: 'evidence_store',
          params: { dataType: 'config_change', data: '${event.payload}' },
          dependsOn: ['step-1'],
        },
      ],
      enabled: true,
      approvalRequired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system',
      executionCount: 0,
      successCount: 0,
      failureCount: 0,
    },
  ];

  inMemoryWorkflows = defaults;
  saveWorkflows();
}

function seedEngineStatuses() {
  const now = new Date().toISOString();
  (Object.keys(ENGINE_LABELS) as AutomationEngineId[]).forEach((id) => {
    if (!engineStatuses[id]) {
      engineStatuses[id] = {
        engine: id,
        status: 'online',
        healthy: true,
        activeTasks: 0,
        totalTasks: 0,
        successRate: 0.95,
        avgDuration: 0,
        lastHeartbeat: now,
        version: '1.0.0',
      };
    }
  });
  saveEngineStatuses();
}

export const publishEvent = (event: Omit<AutomationEvent, 'id' | 'timestamp'>): AutomationEvent => {
  const fullEvent: AutomationEvent = {
    ...event,
    id: generateId('evt'),
    timestamp: new Date().toISOString(),
  };

  inMemoryEvents.unshift(fullEvent);
  if (inMemoryEvents.length > MAX_EVENTS) {
    inMemoryEvents = inMemoryEvents.slice(0, MAX_EVENTS);
  }
  saveEvents();

  const handlers = eventHandlers.get(event.type) || [];
  handlers.forEach((handler) => {
    Promise.resolve(handler(fullEvent)).catch((e) => {
      logger.error(`[AutomationHub] 事件处理失败: ${event.type}`, e);
    });
  });

  const triggerWorkflows = inMemoryWorkflows.filter(
    (wf) =>
      wf.enabled &&
      wf.trigger.type === 'event' &&
      wf.trigger.eventType === event.type
  );

  triggerWorkflows.forEach((wf) => {
    executeWorkflow(wf.id, fullEvent).catch((e) => {
      logger.error(`[AutomationHub] 工作流执行失败: ${wf.name}`, e);
    });
  });

  logger.info(`[AutomationHub] 事件发布: ${event.type} from ${event.source}`);
  return fullEvent;
};

export const subscribeEvent = (eventType: AutomationEventType, handler: EventHandler): (() => void) => {
  const handlers = eventHandlers.get(eventType) || [];
  handlers.push(handler);
  eventHandlers.set(eventType, handlers);

  return () => {
    const arr = eventHandlers.get(eventType) || [];
    const idx = arr.indexOf(handler);
    if (idx > -1) arr.splice(idx, 1);
  };
};

export const getRecentEvents = (limit: number = 50): AutomationEvent[] => {
  return inMemoryEvents.slice(0, limit);
};

const createTask = (params: {
  name: string;
  engine: AutomationEngineId;
  action: string;
  input: Record<string, unknown>;
  priority?: EngineTask['priority'];
  triggerEventId?: string;
  workflowId?: string;
  approvalId?: string;
  maxRetries?: number;
}): EngineTask => {
  const authState = useAuthStore.getState();
  const task: EngineTask = {
    id: generateId('task'),
    name: params.name,
    engine: params.engine,
    action: params.action,
    input: params.input,
    status: params.approvalId ? 'waiting_approval' : 'pending',
    priority: params.priority || 'normal',
    triggerEventId: params.triggerEventId,
    workflowId: params.workflowId,
    approvalId: params.approvalId,
    retryCount: 0,
    maxRetries: params.maxRetries ?? 3,
    createdAt: new Date().toISOString(),
    createdBy: authState.user?.id || 'system',
  };
  inMemoryTasks.unshift(task);
  if (inMemoryTasks.length > MAX_TASKS) {
    inMemoryTasks = inMemoryTasks.slice(0, MAX_TASKS);
  }
  saveTasks();
  return task;
};

const updateTask = (id: string, updates: Partial<EngineTask>): EngineTask | undefined => {
  const idx = inMemoryTasks.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  inMemoryTasks[idx] = { ...inMemoryTasks[idx], ...updates };
  saveTasks();
  return inMemoryTasks[idx];
};

const executeEngineTask = async (task: EngineTask): Promise<EngineTask> => {
  updateTask(task.id, {
    status: 'running',
    startedAt: new Date().toISOString(),
  });

  const startTime = Date.now();

  try {
    const result = await mockEngineExecution(task);

    const duration = Date.now() - startTime;
    const updated = updateTask(task.id, {
      status: 'success',
      completedAt: new Date().toISOString(),
      duration,
      result,
    });

    updateEngineStatus(task.engine, true, duration);
    return updated!;
  } catch (e: any) {
    const duration = Date.now() - startTime;
    const newRetryCount = task.retryCount + 1;

    if (newRetryCount < task.maxRetries) {
      updateTask(task.id, { retryCount: newRetryCount, status: 'pending' });
      logger.warn(`[AutomationHub] 任务失败重试: ${task.name} (${newRetryCount}/${task.maxRetries})`);
      setTimeout(() => {
        const t = inMemoryTasks.find((t) => t.id === task.id);
        if (t) executeEngineTask(t);
      }, 1000 * newRetryCount);
    } else {
      updateTask(task.id, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        duration,
        error: e.message,
        retryCount: newRetryCount,
      });
      updateEngineStatus(task.engine, false, duration);

      await createAuditLog({
        operatorId: task.createdBy,
        operatorName: task.createdBy,
        operatorRole: 'system',
        module: 'system',
        action: 'edit',
        details: `自动化任务执行失败: ${task.name} - ${e.message}`,
        status: 'error',
        targetId: task.id,
        targetType: 'automation_task',
      });
    }
    throw e;
  }
};

async function mockEngineExecution(task: EngineTask): Promise<Record<string, unknown>> {
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 700));

  if (Math.random() < 0.05) {
    throw new Error('模拟引擎执行异常');
  }

  return {
    engine: task.engine,
    action: task.action,
    executedAt: new Date().toISOString(),
    input: task.input,
    output: `${task.engine}:${task.action} 执行成功`,
  };
}

function updateEngineStatus(engine: AutomationEngineId, success: boolean, duration: number) {
  const status = engineStatuses[engine];
  if (!status) return;
  status.totalTasks += 1;
  status.avgDuration = (status.avgDuration + duration) / 2;
  status.lastHeartbeat = new Date().toISOString();
  if (success) {
    status.successRate = status.successRate * 0.9 + 0.1;
  } else {
    status.successRate = status.successRate * 0.9;
  }
  status.activeTasks = Math.max(0, status.activeTasks - 1);
  saveEngineStatuses();
}

export const executeWorkflow = async (
  workflowId: string,
  triggerEvent?: AutomationEvent
): Promise<{ success: boolean; taskIds: string[] }> => {
  const workflow = inMemoryWorkflows.find((w) => w.id === workflowId);
  if (!workflow) {
    logger.error(`[AutomationHub] 工作流不存在: ${workflowId}`);
    return { success: false, taskIds: [] };
  }

  if (!workflow.enabled) {
    logger.warn(`[AutomationHub] 工作流已禁用: ${workflow.name}`);
    return { success: false, taskIds: [] };
  }

  workflow.executionCount += 1;
  saveWorkflows();

  await createAuditLog({
    operatorId: triggerEvent?.userId || workflow.createdBy,
    operatorName: triggerEvent?.userId || workflow.createdBy,
    operatorRole: 'admin',
    module: 'system',
    action: 'create',
    details: `触发工作流: ${workflow.name}${triggerEvent ? ` (事件: ${triggerEvent.type})` : ''}`,
    status: 'info',
    targetId: workflow.id,
    targetType: 'workflow',
  });

  const taskIds: string[] = [];
  const stepResults: Record<string, EngineTask> = {};

  for (const step of workflow.steps) {
    if (step.dependsOn) {
      const allReady = step.dependsOn.every((depId) => {
        const dep = stepResults[depId];
        return dep && (dep.status === 'success' || (step.continueOnError && dep.status !== 'running'));
      });
      if (!allReady) {
        logger.warn(`[AutomationHub] 步骤 ${step.id} 依赖未就绪，跳过`);
        continue;
      }
    }

    const input = interpolateParams(step.params, {
      event: triggerEvent?.payload || {},
      steps: Object.fromEntries(
        Object.entries(stepResults).map(([k, t]) => [k, t.result || {}])
      ),
    });

    let approvalId: string | undefined;

    if (step.id === workflow.steps.find((s) => s.engine === 'bpm' && s.action === 'start_approval')?.id) {
      const approvalType = (step.params.type as ApprovalType) || workflow.approvalType;
      if (approvalType) {
        try {
          const approval = await createApproval({
            type: approvalType,
            title: `${workflow.name} - ${step.action}`,
            description: `由工作流「${workflow.name}」自动触发的审批`,
            afterData: input as any,
          });
          approvalId = approval.id;
        } catch (e) {
          logger.error('[AutomationHub] 创建审批失败', e);
        }
      }
    }

    const task = createTask({
      name: `${workflow.name} - ${step.action}`,
      engine: step.engine,
      action: step.action,
      input,
      priority: 'normal',
      triggerEventId: triggerEvent?.id,
      workflowId: workflow.id,
      approvalId,
      maxRetries: 3,
    });

    taskIds.push(task.id);

    try {
      const result = await executeEngineTask(task);
      stepResults[step.id] = result;

      if (result.status !== 'success' && !step.continueOnError) {
        logger.error(`[AutomationHub] 步骤 ${step.id} 失败，终止工作流`);
        workflow.failureCount += 1;
        saveWorkflows();
        return { success: false, taskIds };
      }
    } catch (e) {
      if (!step.continueOnError) {
        workflow.failureCount += 1;
        saveWorkflows();
        return { success: false, taskIds };
      }
    }
  }

  workflow.successCount += 1;
  saveWorkflows();

  logger.info(`[AutomationHub] 工作流执行完成: ${workflow.name}`);
  return { success: true, taskIds };
};

function interpolateParams(
  template: Record<string, unknown>,
  context: { event: any; steps: Record<string, any> }
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  Object.entries(template).forEach(([key, value]) => {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const path = value.slice(2, -1);
      const parts = path.split('.');
      let cur: any = context;
      for (const p of parts) {
        if (cur && typeof cur === 'object' && p in cur) {
          cur = cur[p];
        } else {
          cur = undefined;
          break;
        }
      }
      result[key] = cur;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = interpolateParams(value as any, context);
    } else {
      result[key] = value;
    }
  });
  return result;
}

export const getAllWorkflows = (): AutomationWorkflow[] => {
  return [...inMemoryWorkflows];
};

export const getWorkflowById = (id: string): AutomationWorkflow | undefined => {
  return inMemoryWorkflows.find((w) => w.id === id);
};

export const createWorkflow = (
  data: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successCount' | 'failureCount'>
): AutomationWorkflow => {
  const authState = useAuthStore.getState();
  const workflow: AutomationWorkflow = {
    ...data,
    id: generateId('wf'),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: authState.user?.id || 'unknown',
    executionCount: 0,
    successCount: 0,
    failureCount: 0,
  };
  inMemoryWorkflows.unshift(workflow);
  saveWorkflows();
  return workflow;
};

export const updateWorkflow = (
  id: string,
  data: Partial<AutomationWorkflow>
): AutomationWorkflow | undefined => {
  const idx = inMemoryWorkflows.findIndex((w) => w.id === id);
  if (idx === -1) return undefined;
  inMemoryWorkflows[idx] = {
    ...inMemoryWorkflows[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  saveWorkflows();
  return inMemoryWorkflows[idx];
};

export const deleteWorkflow = (id: string): boolean => {
  const idx = inMemoryWorkflows.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  inMemoryWorkflows.splice(idx, 1);
  saveWorkflows();
  return true;
};

export const toggleWorkflow = (id: string, enabled: boolean): boolean => {
  const workflow = getWorkflowById(id);
  if (!workflow) return false;
  workflow.enabled = enabled;
  workflow.updatedAt = new Date().toISOString();
  saveWorkflows();
  return true;
};

export const getAllTasks = (filter?: {
  engine?: AutomationEngineId;
  status?: EngineTaskStatus;
  workflowId?: string;
  page?: number;
  pageSize?: number;
}): { list: EngineTask[]; total: number; page: number; pageSize: number } => {
  const page = filter?.page || 1;
  const pageSize = filter?.pageSize || 20;

  let filtered = [...inMemoryTasks];
  if (filter?.engine) filtered = filtered.filter((t) => t.engine === filter.engine);
  if (filter?.status) filtered = filtered.filter((t) => t.status === filter.status);
  if (filter?.workflowId) filtered = filtered.filter((t) => t.workflowId === filter.workflowId);

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  return { list: filtered.slice(start, start + pageSize), total, page, pageSize };
};

export const getEngineStatus = (engine: AutomationEngineId): EngineStatus | undefined => {
  return engineStatuses[engine];
};

export const getAllEngineStatuses = (): EngineStatus[] => {
  return Object.values(engineStatuses);
};

export const setEngineMaintenance = (
  engine: AutomationEngineId,
  maintenance: boolean
): boolean => {
  const status = engineStatuses[engine];
  if (!status) return false;
  status.status = maintenance ? 'maintenance' : 'online';
  status.healthy = !maintenance;
  status.lastHeartbeat = new Date().toISOString();
  saveEngineStatuses();
  return true;
};

export const triggerWorkflowManually = async (
  workflowId: string,
  payload: Record<string, unknown> = {}
): Promise<{ success: boolean; taskIds: string[] }> => {
  const authState = useAuthStore.getState();
  const event: AutomationEvent = {
    id: generateId('evt'),
    type: 'manual.trigger',
    source: 'admin',
    payload,
    timestamp: new Date().toISOString(),
    userId: authState.user?.id,
  };
  inMemoryEvents.unshift(event);
  if (inMemoryEvents.length > MAX_EVENTS) inMemoryEvents = inMemoryEvents.slice(0, MAX_EVENTS);
  saveEvents();

  return executeWorkflow(workflowId, event);
};

export const getHubStatistics = () => {
  const totalWorkflows = inMemoryWorkflows.length;
  const enabledWorkflows = inMemoryWorkflows.filter((w) => w.enabled).length;
  const totalExecutions = inMemoryWorkflows.reduce((sum, w) => sum + w.executionCount, 0);
  const totalSuccesses = inMemoryWorkflows.reduce((sum, w) => sum + w.successCount, 0);
  const totalFailures = inMemoryWorkflows.reduce((sum, w) => sum + w.failureCount, 0);
  const recentEvents = inMemoryEvents.length;
  const runningTasks = inMemoryTasks.filter((t) => t.status === 'running').length;
  const pendingTasks = inMemoryTasks.filter((t) => t.status === 'pending').length;
  const onlineEngines = Object.values(engineStatuses).filter((s) => s.status === 'online').length;

  return {
    totalWorkflows,
    enabledWorkflows,
    totalExecutions,
    totalSuccesses,
    totalFailures,
    successRate: totalExecutions > 0 ? (totalSuccesses / totalExecutions) * 100 : 0,
    recentEvents,
    runningTasks,
    pendingTasks,
    onlineEngines,
    totalEngines: Object.keys(engineStatuses).length,
  };
};

export const automationHub = {
  publishEvent,
  subscribeEvent,
  getRecentEvents,
  executeWorkflow,
  getAllWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  getAllTasks,
  getEngineStatus,
  getAllEngineStatuses,
  setEngineMaintenance,
  triggerWorkflowManually,
  getHubStatistics,
};

export default automationHub;
