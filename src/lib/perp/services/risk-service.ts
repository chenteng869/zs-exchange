import { PerpRiskConfig, Prisma } from '@prisma/client';
import { positionRepo, accountRepo, contractRepo } from '../repos';

export class RiskService {
  private positionRepo: typeof positionRepo;
  private accountRepo: typeof accountRepo;
  private contractRepo: typeof contractRepo;

  constructor(
    customPositionRepo?: typeof positionRepo,
    customAccountRepo?: typeof accountRepo,
    customContractRepo?: typeof contractRepo
  ) {
    this.positionRepo = customPositionRepo || positionRepo;
    this.accountRepo = customAccountRepo || accountRepo;
    this.contractRepo = customContractRepo || contractRepo;
  }

  async calculateMargin(
    symbol: string,
    qty: Prisma.Decimal,
    price: Prisma.Decimal,
    leverage: number
  ): Promise<{ initialMargin: Prisma.Decimal; maintenanceMargin: Prisma.Decimal }> {
    const contract = await this.contractRepo.findBySymbol(symbol);
    if (!contract) throw new Error('Contract not found');

    const notional = qty.mul(price);
    const initialMargin = notional.div(leverage);
    const maintenanceMargin = notional.mul(contract.maintenanceMarginRate);

    return { initialMargin, maintenanceMargin };
  }

  async calculateLiquidationPrice(
    symbol: string,
    side: string,
    entryPrice: Prisma.Decimal,
    leverage: number,
    marginMode: string,
    isolatedMargin?: Prisma.Decimal
  ): Promise<Prisma.Decimal> {
    const contract = await this.contractRepo.findBySymbol(symbol);
    if (!contract) throw new Error('Contract not found');

    const mmRate = new Prisma.Decimal(contract.maintenanceMarginRate);
    const imRate = new Prisma.Decimal(1).div(leverage);

    let liqPrice: Prisma.Decimal;
    if (side === 'long') {
      liqPrice = entryPrice.mul(new Prisma.Decimal(1).sub(imRate).add(mmRate));
    } else {
      liqPrice = entryPrice.mul(new Prisma.Decimal(1).add(imRate).sub(mmRate));
    }

    return liqPrice;
  }

  calculateUnrealizedPnl(
    side: string,
    positionQty: Prisma.Decimal,
    entryPrice: Prisma.Decimal,
    markPrice: Prisma.Decimal
  ): Prisma.Decimal {
    const qty = new Prisma.Decimal(positionQty);
    const entry = new Prisma.Decimal(entryPrice);
    const mark = new Prisma.Decimal(markPrice);

    if (side === 'long') {
      return qty.mul(mark.sub(entry));
    } else {
      return qty.mul(entry.sub(mark));
    }
  }

  async getAccountRisk(userId: string, asset: string): Promise<{
    marginBalance: Prisma.Decimal;
    totalPositionMargin: Prisma.Decimal;
    unrealizedPnl: Prisma.Decimal;
    riskRate: Prisma.Decimal;
    riskLevel: 'safe' | 'warning' | 'danger' | 'critical';
  }> {
    const account = await this.accountRepo.findByUserAssetType(userId, asset, 'cross');
    if (!account) throw new Error('Account not found');

    const positions = await this.positionRepo.findByUserId(userId);
    let totalPositionMargin = new Prisma.Decimal(0);
    let totalUnrealizedPnl = new Prisma.Decimal(0);

    for (const pos of positions) {
      totalPositionMargin = totalPositionMargin.add(pos.positionMargin);
      totalUnrealizedPnl = totalUnrealizedPnl.add(pos.unrealizedPnl);
    }

    const marginBalance = new Prisma.Decimal(account.balance).add(totalUnrealizedPnl);
    const riskRate = totalPositionMargin.gt(0)
      ? marginBalance.div(totalPositionMargin)
      : new Prisma.Decimal(0);

    let riskLevel: 'safe' | 'warning' | 'danger' | 'critical' = 'safe';
    const riskRateNum = riskRate.toNumber();
    if (riskRateNum < 1.1) riskLevel = 'critical';
    else if (riskRateNum < 1.5) riskLevel = 'danger';
    else if (riskRateNum < 2) riskLevel = 'warning';

    return {
      marginBalance,
      totalPositionMargin,
      unrealizedPnl: totalUnrealizedPnl,
      riskRate,
      riskLevel,
    };
  }

  async checkCanOpenPosition(
    userId: string,
    asset: string,
    symbol: string,
    qty: Prisma.Decimal,
    price: Prisma.Decimal,
    leverage: number
  ): Promise<{ canOpen: boolean; reason?: string }> {
    const account = await this.accountRepo.findByUserAssetType(userId, asset, 'cross');
    if (!account) return { canOpen: false, reason: 'Account not found' };

    const { initialMargin } = await this.calculateMargin(symbol, qty, price, leverage);

    if (new Prisma.Decimal(account.availableBalance).lt(initialMargin)) {
      return { canOpen: false, reason: 'Insufficient available balance' };
    }

    return { canOpen: true };
  }
}

export const riskService = new RiskService();
