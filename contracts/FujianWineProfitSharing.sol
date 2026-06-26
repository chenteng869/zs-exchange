// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FujianWineProfitSharing
 * @dev 福建老酒分润智能合约
 *      基于 4/3/3 分润模型：
 *      - 40% 产品成本
 *      - 30% AIOPC 创业家大宗提成
 *      - 30% 剩余分润池（7个角色分配）
 *
 *      支持 369 / 699 美元双档价格
 *      所有分润金额以 USDC (6 decimals) 计价
 */
contract FujianWineProfitSharing {
    // ============================================================
    // 常量定义
    // ============================================================

    uint256 public constant BASIS_POINTS = 10000; // 10000 = 100%

    // 分润比例（4/3/3 模型）
    uint256 public constant PRODUCT_COST_RATIO = 4000;      // 40%
    uint256 public constant AIOPC_COMMISSION_RATIO = 3000;  // 30%
    uint256 public constant PROFIT_POOL_RATIO = 3000;       // 30%

    // 剩余分润池各角色分配比例（基于剩余分润池的 100%）
    // 对应 369 美元单瓶分润基准：
    // 中萨合资公司 $50 / 海外加密资产公司 $21 / 商学院 $12 / 技术团队 $12 / 运营 $8 / 事务部 $4 / 推荐人 $3 = $110
    uint256 public constant ZS_VENTURE_RATIO = 4545;        // $50 / $110 ≈ 45.45%
    uint256 public constant OVERSEAS_CRYPTO_RATIO = 1909;   // $21 / $110 ≈ 19.09%
    uint256 public constant BUSINESS_SCHOOL_RATIO = 1091;   // $12 / $110 ≈ 10.91%
    uint256 public constant TECH_TEAM_RATIO = 1091;         // $12 / $110 ≈ 10.91%
    uint256 public constant OPERATIONS_RATIO = 727;         // $8 / $110 ≈ 7.27%
    uint256 public constant AFFAIRS_DEPT_RATIO = 364;       // $4 / $110 ≈ 3.64%
    uint256 public constant REFERRER_RATIO = 273;           // $3 / $110 ≈ 2.73%

    // 价格档位（美元，以 USDC 6 decimals 计价）
    uint256 public constant PRICE_369 = 369 * 1e6;          // $369
    uint256 public constant PRICE_699 = 699 * 1e6;          // $699

    // ============================================================
    // 角色地址配置
    // ============================================================

    address public owner;
    address public productCostWallet;       // 产品成本钱包
    address public aiopcCommissionWallet;   // AIOPC 创业家大宗提成钱包
    address public zsVentureWallet;         // 中萨合资公司
    address public overseasCryptoWallet;    // 海外加密资产公司
    address public businessSchoolWallet;    // AIOPC 创业家商学院事业部
    address public techTeamWallet;          // 太初国链技术团队
    address public operationsWallet;        // 各个事业部运营事业部
    address public affairsDeptWallet;       // AIOPC 创业家事务部

    // ============================================================
    // 订单与分润记录
    // ============================================================

    struct Order {
        uint256 orderId;
        address buyer;
        address referrer;
        uint256 priceTier;       // 369 or 699 (USDC amount)
        uint256 productCost;
        uint256 aiopcCommission;
        uint256 profitPoolTotal;
        uint256 zsVentureShare;
        uint256 overseasCryptoShare;
        uint256 businessSchoolShare;
        uint256 techTeamShare;
        uint256 operationsShare;
        uint256 affairsDeptShare;
        uint256 referrerShare;
        uint256 timestamp;
        bool processed;
    }

    uint256 public orderCount;
    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public userOrders;
    mapping(address => uint256) public totalEarned; // 各地址累计收益

    // ============================================================
    // 事件
    // ============================================================

    event OrderCreated(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed referrer,
        uint256 priceTier,
        uint256 timestamp
    );

    event ProfitDistributed(
        uint256 indexed orderId,
        uint256 productCost,
        uint256 aiopcCommission,
        uint256 profitPoolTotal,
        uint256 timestamp
    );

    event RoleShareDistributed(
        uint256 indexed orderId,
        address indexed wallet,
        string role,
        uint256 amount
    );

    event WalletUpdated(string role, address oldWallet, address newWallet);

    // ============================================================
    // 构造函数
    // ============================================================

    constructor(
        address _productCostWallet,
        address _aiopcCommissionWallet,
        address _zsVentureWallet,
        address _overseasCryptoWallet,
        address _businessSchoolWallet,
        address _techTeamWallet,
        address _operationsWallet,
        address _affairsDeptWallet
    ) {
        owner = msg.sender;
        productCostWallet = _productCostWallet;
        aiopcCommissionWallet = _aiopcCommissionWallet;
        zsVentureWallet = _zsVentureWallet;
        overseasCryptoWallet = _overseasCryptoWallet;
        businessSchoolWallet = _businessSchoolWallet;
        techTeamWallet = _techTeamWallet;
        operationsWallet = _operationsWallet;
        affairsDeptWallet = _affairsDeptWallet;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ============================================================
    // 核心分润逻辑
    // ============================================================

    /**
     * @dev 创建订单并执行分润
     * @param referrer 推荐人地址（零地址表示无推荐人）
     * @param priceTier 价格档位（369 或 699 美元对应的 USDC 数量）
     */
    function createOrder(address referrer, uint256 priceTier) external payable returns (uint256) {
        require(priceTier == PRICE_369 || priceTier == PRICE_699, "Invalid price tier");
        require(msg.value == priceTier, "Incorrect payment amount");

        orderCount++;
        uint256 orderId = orderCount;

        // 计算各部分分润
        uint256 productCost = (priceTier * PRODUCT_COST_RATIO) / BASIS_POINTS;
        uint256 aiopcCommission = (priceTier * AIOPC_COMMISSION_RATIO) / BASIS_POINTS;
        uint256 profitPool = (priceTier * PROFIT_POOL_RATIO) / BASIS_POINTS;

        // 计算剩余分润池中各角色分配
        uint256 zsVentureShare = (profitPool * ZS_VENTURE_RATIO) / BASIS_POINTS;
        uint256 overseasCryptoShare = (profitPool * OVERSEAS_CRYPTO_RATIO) / BASIS_POINTS;
        uint256 businessSchoolShare = (profitPool * BUSINESS_SCHOOL_RATIO) / BASIS_POINTS;
        uint256 techTeamShare = (profitPool * TECH_TEAM_RATIO) / BASIS_POINTS;
        uint256 operationsShare = (profitPool * OPERATIONS_RATIO) / BASIS_POINTS;
        uint256 affairsDeptShare = (profitPool * AFFAIRS_DEPT_RATIO) / BASIS_POINTS;
        uint256 referrerShare = (profitPool * REFERRER_RATIO) / BASIS_POINTS;

        // 记录订单
        orders[orderId] = Order({
            orderId: orderId,
            buyer: msg.sender,
            referrer: referrer,
            priceTier: priceTier,
            productCost: productCost,
            aiopcCommission: aiopcCommission,
            profitPoolTotal: profitPool,
            zsVentureShare: zsVentureShare,
            overseasCryptoShare: overseasCryptoShare,
            businessSchoolShare: businessSchoolShare,
            techTeamShare: techTeamShare,
            operationsShare: operationsShare,
            affairsDeptShare: affairsDeptShare,
            referrerShare: referrerShare,
            timestamp: block.timestamp,
            processed: true
        });

        userOrders[msg.sender].push(orderId);

        // 分发资金
        _distributeFunds(
            orderId,
            productCost,
            aiopcCommission,
            zsVentureShare,
            overseasCryptoShare,
            businessSchoolShare,
            techTeamShare,
            operationsShare,
            affairsDeptShare,
            referrer,
            referrerShare
        );

        emit OrderCreated(orderId, msg.sender, referrer, priceTier, block.timestamp);
        emit ProfitDistributed(orderId, productCost, aiopcCommission, profitPool, block.timestamp);

        return orderId;
    }

    /**
     * @dev 内部：分发资金到各角色钱包
     */
    function _distributeFunds(
        uint256 orderId,
        uint256 productCost,
        uint256 aiopcCommission,
        uint256 zsVentureShare,
        uint256 overseasCryptoShare,
        uint256 businessSchoolShare,
        uint256 techTeamShare,
        uint256 operationsShare,
        uint256 affairsDeptShare,
        address referrer,
        uint256 referrerShare
    ) internal {
        // 产品成本
        _transferAndRecord(productCostWallet, productCost, "product_cost");
        emit RoleShareDistributed(orderId, productCostWallet, "product_cost", productCost);

        // AIOPC 创业家大宗提成
        _transferAndRecord(aiopcCommissionWallet, aiopcCommission, "aiopc_commission");
        emit RoleShareDistributed(orderId, aiopcCommissionWallet, "aiopc_commission", aiopcCommission);

        // 中萨合资公司
        _transferAndRecord(zsVentureWallet, zsVentureShare, "zs_venture");
        emit RoleShareDistributed(orderId, zsVentureWallet, "zs_venture", zsVentureShare);

        // 海外加密资产公司
        _transferAndRecord(overseasCryptoWallet, overseasCryptoShare, "overseas_crypto");
        emit RoleShareDistributed(orderId, overseasCryptoWallet, "overseas_crypto", overseasCryptoShare);

        // AIOPC 创业家商学院事业部
        _transferAndRecord(businessSchoolWallet, businessSchoolShare, "business_school");
        emit RoleShareDistributed(orderId, businessSchoolWallet, "business_school", businessSchoolShare);

        // 太初国链技术团队
        _transferAndRecord(techTeamWallet, techTeamShare, "tech_team");
        emit RoleShareDistributed(orderId, techTeamWallet, "tech_team", techTeamShare);

        // 各个事业部运营事业部
        _transferAndRecord(operationsWallet, operationsShare, "operations");
        emit RoleShareDistributed(orderId, operationsWallet, "operations", operationsShare);

        // AIOPC 创业家事务部
        _transferAndRecord(affairsDeptWallet, affairsDeptShare, "affairs_dept");
        emit RoleShareDistributed(orderId, affairsDeptWallet, "affairs_dept", affairsDeptShare);

        // 推荐人（如果有）
        if (referrer != address(0)) {
            _transferAndRecord(referrer, referrerShare, "referrer");
            emit RoleShareDistributed(orderId, referrer, "referrer", referrerShare);
        } else {
            // 无推荐人时，推荐人奖励归入事务部
            _transferAndRecord(affairsDeptWallet, referrerShare, "affairs_dept_bonus");
            emit RoleShareDistributed(orderId, affairsDeptWallet, "affairs_dept_bonus", referrerShare);
        }
    }

    /**
     * @dev 内部：转账并记录累计收益
     */
    function _transferAndRecord(address to, uint256 amount, string memory role) internal {
        if (amount == 0 || to == address(0)) return;

        totalEarned[to] += amount;

        (bool success, ) = payable(to).call{value: amount}("");
        require(success, string(abi.encodePacked("Transfer failed: ", role)));
    }

    // ============================================================
    // 查询函数
    // ============================================================

    /**
     * @dev 查询某价格档位的分润明细
     * @param priceTier 价格档位（USDC 数量）
     */
    function getProfitBreakdown(uint256 priceTier) external pure returns (
        uint256 productCost,
        uint256 aiopcCommission,
        uint256 profitPool,
        uint256 zsVentureShare,
        uint256 overseasCryptoShare,
        uint256 businessSchoolShare,
        uint256 techTeamShare,
        uint256 operationsShare,
        uint256 affairsDeptShare,
        uint256 referrerShare
    ) {
        productCost = (priceTier * PRODUCT_COST_RATIO) / BASIS_POINTS;
        aiopcCommission = (priceTier * AIOPC_COMMISSION_RATIO) / BASIS_POINTS;
        profitPool = (priceTier * PROFIT_POOL_RATIO) / BASIS_POINTS;

        zsVentureShare = (profitPool * ZS_VENTURE_RATIO) / BASIS_POINTS;
        overseasCryptoShare = (profitPool * OVERSEAS_CRYPTO_RATIO) / BASIS_POINTS;
        businessSchoolShare = (profitPool * BUSINESS_SCHOOL_RATIO) / BASIS_POINTS;
        techTeamShare = (profitPool * TECH_TEAM_RATIO) / BASIS_POINTS;
        operationsShare = (profitPool * OPERATIONS_RATIO) / BASIS_POINTS;
        affairsDeptShare = (profitPool * AFFAIRS_DEPT_RATIO) / BASIS_POINTS;
        referrerShare = (profitPool * REFERRER_RATIO) / BASIS_POINTS;
    }

    /**
     * @dev 获取用户订单数量
     */
    function getUserOrderCount(address user) external view returns (uint256) {
        return userOrders[user].length;
    }

    /**
     * @dev 分页获取用户订单
     */
    function getUserOrders(address user, uint256 offset, uint256 limit) external view returns (Order[] memory) {
        uint256 total = userOrders[user].length;
        if (offset >= total) return new Order[](0);

        uint256 end = offset + limit;
        if (end > total) end = total;
        uint256 size = end - offset;

        Order[] memory result = new Order[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = orders[userOrders[user][offset + i]];
        }
        return result;
    }

    // ============================================================
    // 管理函数（仅 Owner）
    // ============================================================

    function setProductCostWallet(address _wallet) external onlyOwner {
        emit WalletUpdated("product_cost", productCostWallet, _wallet);
        productCostWallet = _wallet;
    }

    function setAiopcCommissionWallet(address _wallet) external onlyOwner {
        emit WalletUpdated("aiopc_commission", aiopcCommissionWallet, _wallet);
        aiopcCommissionWallet = _wallet;
    }

    function setZsVentureWallet(address _wallet) external onlyOwner {
        emit WalletUpdated("zs_venture", zsVentureWallet, _wallet);
        zsVentureWallet = _wallet;
    }

    function setOverseasCryptoWallet(address _wallet) external onlyOwner {
        emit WalletUpdated("overseas_crypto", overseasCryptoWallet, _wallet);
        overseasCryptoWallet = _wallet;
    }

    function setBusinessSchoolWallet(address _wallet) external onlyOwner {
        emit WalletUpdated("business_school", businessSchoolWallet, _wallet);
        businessSchoolWallet = _wallet;
    }

    function setTechTeamWallet(address _wallet) external onlyOwner {
        emit WalletUpdated("tech_team", techTeamWallet, _wallet);
        techTeamWallet = _wallet;
    }

    function setOperationsWallet(address _wallet) external onlyOwner {
        emit WalletUpdated("operations", operationsWallet, _wallet);
        operationsWallet = _wallet;
    }

    function setAffairsDeptWallet(address _wallet) external onlyOwner {
        emit WalletUpdated("affairs_dept", affairsDeptWallet, _wallet);
        affairsDeptWallet = _wallet;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    // ============================================================
    // 紧急提取（仅 Owner，用于异常情况）
    // ============================================================

    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Withdraw failed");
    }

    // 接收 ETH
    receive() external payable {}
}
