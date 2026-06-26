/**
 * 签名确认管理器
 *
 * 功能：
 *  - 消息签名确认
 *  - TypedData 签名确认
 *  - 交易签名确认
 *  - 授权确认
 *  - 风险评估
 *  - 确认队列管理
 *
 * 支持：
 *  - 自定义确认处理器
 *  - 自动过期
 *  - 风险提示
 *  - 交易解析
 */

import type {
  SignRequest,
  TransactionRequest,
  EIP712TypedData,
} from '../sdk.types';

import type {
  ISignConfirmHandler,
  SignConfirmResult,
  TransactionConfirmResult,
  ConfirmDialogConfig,
  RiskAssessment,
  RiskLevel,
  RiskItem,
  ParsedTransactionDetail,
  TransactionAction,
  TypedDataDisplay,
  ConfirmRequestState,
  ConfirmStatus,
} from './sign-confirm.interface';

/**
 * 签名确认管理器类
 */
export class SignConfirmManager {
  /** 自定义确认处理器 */
  private customHandler: ISignConfirmHandler | null = null;

  /** 待处理的确认请求 */
  private pendingRequests: Map<string, ConfirmRequestState> = new Map();

  /** 已销毁标志 */
  private destroyed: boolean = false;

  /** 默认过期时间（5分钟） */
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000;

  /** 最大待处理请求数 */
  private readonly MAX_PENDING_REQUESTS = 10;

  // ==========================================================================
  // 构造函数
  // ==========================================================================

  constructor(
    private readonly sdk: any,
  ) {}

  // ==========================================================================
  // 初始化与销毁
  // ==========================================================================

  /**
   * 初始化签名确认管理器
   */
  public async initialize(): Promise<void> {
    if (this.destroyed) return;

    this.startExpiryChecker();
    console.log('[SignConfirmManager] 初始化完成');
  }

  /**
   * 销毁签名确认管理器
   */
  public destroy(): void {
    this.destroyed = true;
    this.pendingRequests.clear();
    this.customHandler = null;
    console.log('[SignConfirmManager] 已销毁');
  }

  // ==========================================================================
  // 自定义处理器
  // ==========================================================================

  /**
   * 设置自定义确认处理器
   */
  public setCustomHandler(handler: ISignConfirmHandler | null): void {
    this.customHandler = handler;
  }

  /**
   * 兼容旧调用入口
   */
  public async requestConfirmation(request: {
    signRequest?: SignRequest;
    transaction?: TransactionRequest;
    [key: string]: unknown;
  }): Promise<{ approved: boolean }> {
    if (request.signRequest) {
      return {
        approved: await this.requestSignConfirmation(request.signRequest),
      };
    }

    if (request.transaction) {
      return {
        approved: await this.requestTransactionConfirmation(request.transaction),
      };
    }

    return { approved: true };
  }

  /**
   * 获取当前确认处理器
   */
  public getHandler(): ISignConfirmHandler | null {
    return this.customHandler;
  }

  // ==========================================================================
  // 签名确认
  // ==========================================================================

  /**
   * 请求签名确认
   */
  public async requestSignConfirmation(request: SignRequest): Promise<boolean> {
    if (this.destroyed) return false;

    if (this.pendingRequests.size >= this.MAX_PENDING_REQUESTS) {
      console.warn('[SignConfirmManager] 待处理请求过多');
      return false;
    }

    const state: ConfirmRequestState = {
      requestId: request.id,
      type: 'sign',
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: request.expiresAt || Date.now() + this.DEFAULT_EXPIRY,
      dappInfo: request.dappInfo,
    };

    this.pendingRequests.set(request.id, state);

    try {
      state.status = 'displaying';

      let result: SignConfirmResult;

      if (this.customHandler) {
        result = await this.customHandler.handleSignConfirm(request);
      } else {
        result = await this.defaultSignConfirm(request);
      }

      state.status = result.result === 'approved' ? 'approved' : result.result === 'rejected' ? 'rejected' : 'expired';

      return result.result === 'approved';
    } finally {
      this.pendingRequests.delete(request.id);
    }
  }

  /**
   * 请求交易确认
   */
  public async requestTransactionConfirmation(request: TransactionRequest): Promise<boolean> {
    if (this.destroyed) return false;

    if (this.pendingRequests.size >= this.MAX_PENDING_REQUESTS) {
      console.warn('[SignConfirmManager] 待处理请求过多');
      return false;
    }

    const state: ConfirmRequestState = {
      requestId: request.id,
      type: 'transaction',
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + this.DEFAULT_EXPIRY,
      dappInfo: request.dappInfo,
    };

    this.pendingRequests.set(request.id, state);

    try {
      state.status = 'displaying';

      let result: TransactionConfirmResult;

      if (this.customHandler) {
        result = await this.customHandler.handleTransactionConfirm(request);
      } else {
        result = await this.defaultTransactionConfirm(request);
      }

      state.status = result.result === 'approved' ? 'approved' : result.result === 'rejected' ? 'rejected' : 'expired';

      return result.result === 'approved';
    } finally {
      this.pendingRequests.delete(request.id);
    }
  }

  // ==========================================================================
  // 待处理请求管理
  // ==========================================================================

  /**
   * 获取所有待处理请求
   */
  public getPendingRequests(): ConfirmRequestState[] {
    return Array.from(this.pendingRequests.values());
  }

  /**
   * 获取待处理请求数量
   */
  public getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * 取消确认请求
   */
  public cancelRequest(requestId: string): void {
    const state = this.pendingRequests.get(requestId);
    if (state) {
      state.status = 'cancelled';
      this.pendingRequests.delete(requestId);

      if (this.customHandler) {
        this.customHandler.cancelConfirm(requestId);
      }
    }
  }

  /**
   * 取消所有待处理请求
   */
  public cancelAllRequests(): void {
    for (const [requestId] of this.pendingRequests) {
      this.cancelRequest(requestId);
    }
  }

  // ==========================================================================
  // 风险评估
  // ==========================================================================

  /**
   * 评估签名请求风险
   */
  public assessSignRisk(request: SignRequest): RiskAssessment {
    const items: RiskItem[] = [];
    let score = 100;

    if (request.type === 'ethSignTypedDataV4') {
      items.push({
        code: 'TYPED_DATA',
        message: '这是一个结构化数据签名请求',
        level: 'safe',
      });
    }

    if (request.type === 'ethSign') {
      items.push({
        code: 'ETH_SIGN_WARNING',
        message: 'eth_sign 可能被用于签名交易，请谨慎确认',
        level: 'warning',
      });
      score -= 20;
    }

    if (request.dappInfo) {
      if (!request.dappInfo.verified) {
        items.push({
          code: 'UNVERIFIED_DAPP',
          message: '该 DApp 未经过验证',
          level: 'warning',
        });
        score -= 10;
      }
    }

    const level: RiskLevel = score >= 70 ? 'safe' : score >= 40 ? 'warning' : 'danger';

    return {
      level,
      items,
      score,
    };
  }

  /**
   * 评估交易请求风险
   */
  public assessTransactionRisk(request: TransactionRequest): RiskAssessment {
    const items: RiskItem[] = [];
    let score = 100;

    const parsedTx = request.parsedTx;

    if (parsedTx?.methodName === 'approve') {
      items.push({
        code: 'APPROVE_WARNING',
        message: '这是一个授权操作，请确认授权金额合理',
        level: 'warning',
      });
      score -= 15;

      const amount = parsedTx.parameters?.amount;
      if (amount && amount.toString().length > 30) {
        items.push({
          code: 'UNLIMITED_APPROVE',
          message: '无限额授权存在安全风险',
          level: 'danger',
        });
        score -= 30;
      }
    }

    if (request.to && !this.isVerifiedContract(request.to, request.chainId)) {
      items.push({
        code: 'UNKNOWN_CONTRACT',
        message: '与未验证的合约交互存在风险',
        level: 'warning',
      });
      score -= 15;
    }

    if (request.value && BigInt(request.value) > BigInt('10000000000000000000')) {
      items.push({
        code: 'LARGE_TRANSFER',
        message: '大额转账，请仔细核对地址',
        level: 'warning',
      });
      score -= 10;
    }

    const level: RiskLevel = score >= 70 ? 'safe' : score >= 40 ? 'warning' : 'danger';

    return {
      level,
      items,
      score,
    };
  }

  // ==========================================================================
  // 交易解析
  // ==========================================================================

  /**
   * 解析交易数据
   */
  public parseTransaction(request: TransactionRequest): ParsedTransactionDetail {
    const action = this.detectTransactionAction(request);
    const summary = this.generateTransactionSummary(request, action);

    return {
      action,
      methodName: request.parsedTx?.methodName,
      functionSignature: request.parsedTx?.functionSignature,
      contractAddress: request.to,
      contractName: request.parsedTx?.contractName,
      tokenInfo: request.parsedTx?.tokenInfo
        ? {
            name: request.parsedTx.tokenInfo.name,
            symbol: request.parsedTx.tokenInfo.symbol,
            decimals: request.parsedTx.tokenInfo.decimals,
            address: request.parsedTx.tokenInfo.address,
          }
        : undefined,
      recipient: request.to,
      formattedAmount: request.parsedTx?.formattedValue,
      summary,
      parameters: request.parsedTx?.parameters,
    };
  }

  /**
   * 检测交易动作类型
   */
  private detectTransactionAction(request: TransactionRequest): TransactionAction {
    if (!request.data || request.data === '0x') {
      return 'transfer';
    }

    const methodSig = request.data.slice(0, 10);

    const methodMap: Record<string, TransactionAction> = {
      '0x095ea7b3': 'approve',
      '0xa9059cbb': 'transfer',
      '0x23b872dd': 'transfer',
      '0x022c0d9f': 'swap',
      '0x38ed1739': 'swap',
      '0x7ff36ab5': 'swap',
      '0x69328416': 'stake',
      '0x2e1a7d4d': 'unstake',
      '0x3ccfd60b': 'call',
      '0x4e71d92d': 'claim',
    };

    return methodMap[methodSig] || 'call';
  }

  /**
   * 生成交易摘要
   */
  private generateTransactionSummary(
    request: TransactionRequest,
    action: TransactionAction
  ): string {
    switch (action) {
      case 'transfer':
        return `转账 ${request.parsedTx?.formattedValue || request.value || '0'} 到 ${request.to?.slice(0, 10)}...`;
      case 'approve':
        return `授权 ${request.parsedTx?.contractName || '合约'} 使用代币`;
      case 'swap':
        return '代币兑换';
      case 'stake':
        return '质押代币';
      case 'unstake':
        return '取消质押';
      case 'claim':
        return '领取奖励';
      case 'deploy':
        return '部署合约';
      case 'call':
        return '合约调用';
      default:
        return '未知操作';
    }
  }

  // ==========================================================================
  // TypedData 显示处理
  // ==========================================================================

  /**
   * 处理 TypedData 显示格式
   */
  public formatTypedData(typedData: EIP712TypedData): TypedDataDisplay {
    const fields: TypedDataDisplay['fields'] = [];

    if (typedData.types[typedData.primaryType]) {
      for (const typeField of typedData.types[typedData.primaryType]) {
        const value = typedData.message[typeField.name];
        fields.push({
          name: typeField.name,
          type: typeField.type,
          value: value,
          sensitive: this.isSensitiveField(typeField.name),
        });
      }
    }

    const safeToDisplay = this.isSafeToDisplay(typedData);

    return {
      domain: {
        name: typedData.domain.name,
        version: typedData.domain.version,
        chainId: typedData.domain.chainId?.toString(),
        verifyingContract: typedData.domain.verifyingContract,
      },
      primaryType: typedData.primaryType,
      fields,
      safeToDisplay,
    };
  }

  /**
   * 判断字段是否敏感
   */
  private isSensitiveField(name: string): boolean {
    const sensitiveNames = ['privateKey', 'password', 'seed', 'mnemonic'];
    return sensitiveNames.some(s => name.toLowerCase().includes(s.toLowerCase()));
  }

  /**
   * 判断 TypedData 是否可以安全显示
   */
  private isSafeToDisplay(typedData: EIP712TypedData): boolean {
    const primaryFields = typedData.types[typedData.primaryType] || [];

    for (const field of primaryFields) {
      if (this.isSensitiveField(field.name)) {
        return false;
      }
    }

    return true;
  }

  // ==========================================================================
  // 默认确认处理
  // ==========================================================================

  /**
   * 默认签名确认
   */
  private async defaultSignConfirm(request: SignRequest): Promise<SignConfirmResult> {
    console.log('[SignConfirmManager] 默认签名确认（自动拒绝，请设置自定义处理器）');
    return {
      result: 'rejected',
      reason: 'No custom handler configured',
    };
  }

  /**
   * 默认交易确认
   */
  private async defaultTransactionConfirm(
    request: TransactionRequest
  ): Promise<TransactionConfirmResult> {
    console.log('[SignConfirmManager] 默认交易确认（自动拒绝，请设置自定义处理器）');
    return {
      result: 'rejected',
      reason: 'No custom handler configured',
    };
  }

  // ==========================================================================
  // 过期检查
  // ==========================================================================

  /**
   * 启动过期检查器
   */
  private startExpiryChecker(): void {
    const checkInterval = setInterval(() => {
      if (this.destroyed) {
        clearInterval(checkInterval);
        return;
      }

      const now = Date.now();
      for (const [requestId, state] of this.pendingRequests) {
        if (state.expiresAt && now > state.expiresAt) {
          state.status = 'expired';
          this.pendingRequests.delete(requestId);
          console.log(`[SignConfirmManager] 请求已过期: ${requestId}`);
        }
      }
    }, 10000);
  }

  // ==========================================================================
  // 工具方法
  // ==========================================================================

  /**
   * 检查合约是否已验证（简化实现）
   */
  private isVerifiedContract(address: string, chainId: number): boolean {
    return true;
  }

  /**
   * 获取确认弹窗默认配置
   */
  public getDefaultDialogConfig(type: 'sign' | 'transaction'): ConfirmDialogConfig {
    if (type === 'sign') {
      return {
        showCancel: true,
        confirmText: '签名',
        cancelText: '拒绝',
        showDetails: true,
        showRiskWarning: true,
      };
    } else {
      return {
        showCancel: true,
        confirmText: '确认发送',
        cancelText: '取消',
        showDetails: true,
        showRiskWarning: true,
        allowGasAdjustment: true,
      };
    }
  }
}
