'use client';

import { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Tag, Button, Space, Statistic, Badge, Timeline, Empty, Modal, Descriptions, Tooltip, message } from 'antd';
import {
  BellOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  FireOutlined,
  EyeOutlined,
  ClearOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

// 告警级别类型
type AlertLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

// 告警接口
interface RealtimeAlert {
  id: string;
  timestamp: string;
  level: AlertLevel;
  source: string;
  category: string;
  title: string;
  description: string;
  ioc?: string;
  status: 'new' | 'acknowledged' | 'processing' | 'resolved';
  assignee?: string;
  acknowledgedAt?: string;
}

// 模拟实时告警数据流
const generateAlerts = (): RealtimeAlert[] => {
  const baseTime = new Date();
  return [
    { id: 'ALT-001', timestamp: formatTime(baseTime, -12), level: 'critical', source: 'IDS-主集群', category: '入侵检测', title: '[严重] 检测到SQL注入攻击', description: '来源IP: 203.0.113.50 针对用户登录接口发起UNION SELECT注入攻击，已自动拦截', ioc: '203.0.113.50', status: 'processing', assignee: 'wang_fang' },
    { id: 'ALT-002', timestamp: formatTime(baseTime, -45), level: 'critical', source: '链上监控', category: '区块链安全', title: '[严重] DeFi闪电贷款攻击预警', description: '检测到可疑的大额闪电贷操作模式，与已知攻击手法相似度92%，涉及流动性池A', ioc: '0xAttackWallet...', status: 'new' },
    { id: 'ALT-003', timestamp: formatTime(baseTime, -120), level: 'high', source: 'WAF-边缘节点', category: 'Web攻击', title: '[高危] XSS存储型攻击被拦截', description: '在内容评论接口拦截存储型XSS攻击载荷，来源IP: 185.220.101.50', ioc: '185.220.101.50', status: 'acknowledged', assignee: 'li_ming', acknowledgedAt: formatTime(baseTime, -115) },
    { id: 'ALT-004', timestamp: formatTime(baseTime, -180), level: 'high', source: 'DDoS防护', category: 'DDoS攻击', title: '[高危] DDoS攻击流量峰值告警', description: '入站流量达到正常基线的850%，峰值2.8Gbps，已启动流量清洗', status: 'processing', assignee: 'zhang_wei' },
    { id: 'ALT-005', timestamp: formatTime(baseTime, -300), level: 'medium', source: 'DLP系统', category: '数据安全', title: '[中危] 异常数据导出行为检测', description: '用户 suspicious_user_007 在非工作时间批量导出KYC数据，共1250条记录', status: 'acknowledged', assignee: 'li_ming' },
    { id: 'ALT-006', timestamp: formatTime(baseTime, -420), level: 'high', source: '威胁情报', category: '钓鱼攻击', title: '[高危] 新发现假冒交易所域名', description: '发现3个仿冒中萨交易所的钓鱼域名正在通过搜索引擎投放传播', ioc: 'guoxue-exchange[.]xyz', status: 'new' },
    { id: 'ALT-007', timestamp: formatTime(baseTime, -540), level: 'medium', source: '异常行为分析', category: '账户安全', title: '[中危] 多账户关联异常登录', description: '检测到5个不同账户在短时间内从同一设备切换登录，可能存在账号共享或被盗', status: 'resolved' },
    { id: 'ALT-008', timestamp: formatTime(baseTime, -720), level: 'low', source: 'WAF-规则引擎', category: '扫描探测', title: '[低危] 安全扫描器探测活动', description: '检测到Nikto和DirBuster扫描特征来自IP 45.33.32.156，已被自动封禁', ioc: '45.33.32.156', status: 'resolved' },
    { id: 'ALT-009', timestamp: formatTime(baseTime, -900), level: 'info', source: '系统监控', category: '运维通知', title: '[信息] SSL证书即将到期提醒', description: 'api.zs.exchange 的SSL证书将在15天后到期，请及时续签', status: 'acknowledged', assignee: 'chen_hui' },
    { id: 'ALT-010', timestamp: formatTime(baseTime, -1080), level: 'high', source: '智能合约审计', category: '区块链安全', title: '[高危] 合约Gas优化建议', description: 'GXT Token合约v2的transfer函数存在不必要的SSTORE操作，可优化Gas消耗约15%', status: 'new' },
    { id: 'ALT-011', timestamp: formatTime(baseTime, -1260), level: 'medium', source: '访问控制', category: '权限管理', title: '[中危] 权限变更审计告警', description: '管理员admin在非工作时间修改了超级管理员角色权限配置', status: 'acknowledged', assignee: 'zhao_jun' },
    { id: 'ALT-012', timestamp: formatTime(baseTime, -1500), level: 'critical', source: '勒索软件防护', category: '恶意软件', title: '[严重] 终端勒索软件感染警报', description: '财务部门workstation-finance-03检测到LockBit变体恶意进程执行，已自动隔离', status: 'processing', assignee: 'chen_hui' },
  ];
};

function formatTime(base: Date, secondsAgo: number): string {
  const d = new Date(base.getTime() - secondsAgo * 1000);
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// 级别配置
const levelConfig: Record<AlertLevel, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  critical: { color: '#B91C1C', bgColor: 'border-l-red-500 bg-red-950/30', icon: <FireOutlined />, label: '严重' },
  high: { color: '#F59E0B', bgColor: 'border-l-orange-500 bg-orange-950/20', icon: <WarningOutlined />, label: '高危' },
  medium: { color: '#F59E0B', bgColor: 'border-l-yellow-500 bg-yellow-950/20', icon: <ExclamationCircleOutlined />, label: '中危' },
  low: { color: '#1677FF', bgColor: 'border-l-blue-500 bg-blue-950/20', icon: <InfoCircleOutlined />, label: '低危' },
  info: { color: '#16A34A', bgColor: 'border-l-green-500 bg-green-950/20', icon: <InfoCircleOutlined />, label: '信息' },
};

const statusConfig: Record<string, { color: string; text: string }> = {
  new: { color: 'red', text: '待处理' },
  acknowledged: { color: 'orange', text: '已确认' },
  processing: { color: 'blue', text: '处理中' },
  resolved: { color: 'green', text: '已解决' },
};

export default function RealtimeAlertsPage() {
  const [alerts, setAlerts] = useState<RealtimeAlert[]>(generateAlerts());
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [selectedAlert, setSelectedAlert] = useState<RealtimeAlert | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const alertEndRef = useRef<HTMLDivElement>(null);

  // 模拟新告警到达
  useEffect(() => {
    const timer = setInterval(() => {
      if (Math.random() > 0.7) {
        const newAlert: RealtimeAlert = {
          id: `ALT-${Date.now().toString(36)}`,
          timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
          level: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] as AlertLevel,
          source: ['IDS-主集群', 'WAF-边缘节点', '链上监控', 'DLP系统', '威胁情报'][Math.floor(Math.random() * 5)],
          category: ['入侵检测', 'Web攻击', '区块链安全', '数据安全', '钓鱼攻击'][Math.floor(Math.random() * 5)],
          title: `[${['严重', '高危', '中危', '低危'][Math.floor(Math.random() * 4)]}] 检测到${['异常登录', '可疑交易', '攻击尝试', '违规操作'][Math.floor(Math.random() * 4)]}`,
          description: `自动生成的模拟告警消息 #${Math.floor(Math.random() * 1000)}`,
          status: 'new',
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 30));
      }
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // 自动滚动到底部
  useEffect(() => {
    alertEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [alerts.length]);

  const filteredAlerts = alerts.filter(a => !levelFilter || a.level === levelFilter);

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' as const, acknowledgedAt: new Date().toLocaleString('zh-CN', { hour12: false }), assignee: '当前操作员' } : a));
    message.success('告警已确认');
  };

  const handleResolve = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' as const } : a));
    message.success('告警已标记为解决');
  };

  // 统计
  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.level === 'critical').length,
    high: alerts.filter(a => a.level === 'high').length,
    medium: alerts.filter(a => a.level === 'medium').length,
    low: alerts.filter(a => a.level === 'low').length,
    info: alerts.filter(a => a.level === 'info').length,
    newCount: alerts.filter(a => a.status === 'new').length,
    processing: alerts.filter(a => a.status === 'processing').length,
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#0a0e1a] text-white -m-6 p-6">
        {/* 顶部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BellOutlined className="text-3xl text-red-400 animate-pulse" />
            <div>
              <h1 className="text-2xl font-bold m-0 text-red-400">实时告警中心</h1>
              <p className="text-xs text-gray-500">REAL-TIME ALERT MONITORING SYSTEM</p>
            </div>
            <Badge count={stats.newCount} style={{ backgroundColor: '#B91C1C' }} />
          </div>
          <Space>
            <Button icon={soundEnabled ? <SoundOutlined /> : <SoundOutlined style={{ opacity: 0.4 }} />} onClick={() => setSoundEnabled(!soundEnabled)} className="bg-gray-800 border-gray-700 text-gray-300">
              {soundEnabled ? '声音开' : '声音关'}
            </Button>
            <Button icon={<ClearOutlined />} onClick={() => setAlerts(prev => prev.filter(a => a.status !== 'resolved'))} className="bg-gray-800 border-gray-700 text-gray-300">清除已解决</Button>
            <Button icon={<SettingOutlined />} className="bg-gray-800 border-gray-700 text-gray-300">告警规则</Button>
          </Space>
        </div>

        {/* 告警统计面板 */}
        <Row gutter={[12, 12]} className="mb-6">
          {[
            { label: '总告警', value: stats.total, color: '#fff' },
            { label: '严重', value: stats.critical, color: '#B91C1C' },
            { label: '高危', value: stats.high, color: '#F59E0B' },
            { label: '中危', value: stats.medium, color: '#F59E0B' },
            { label: '待处理', value: stats.newCount, color: '#DC2626' },
            { label: '处理中', value: stats.processing, color: '#1677FF' },
          ].map((item, idx) => (
            <Col key={idx} xs={8} sm={4}>
              <Card className="bg-gray-900/50 border border-gray-700 text-center" bordered={false} size="small">
                <Statistic title={<span className="text-gray-400 text-xs">{item.label}</span>} value={item.value} valueStyle={{ color: item.color, fontSize: 24 }} />
              </Card>
            </Col>
          ))}
        </Row>

        {/* 分类统计 */}
        <Row gutter={[12, 12]} className="mb-6">
          {[
            { title: '按级别', data: [{ label: '严重', value: stats.critical, color: 'red' }, { label: '高危', value: stats.high, color: 'orange' }, { label: '中危', value: stats.medium, color: 'yellow' }, { label: '低危', value: stats.low, color: 'blue' }, { label: '信息', value: stats.info, color: 'green' }] },
            { title: '按来源', data: [...new Set(alerts.map(a => a.source))].map(s => ({ label: s.replace('-', '\n'), value: alerts.filter(a => a.source === s).length, color: 'cyan' })) },
            { title: '按类别', data: [...new Set(alerts.map(a => a.category))].map(c => ({ label: c, value: alerts.filter(a => a.category === c).length, color: 'purple' })) },
          ].map((panel, idx) => (
            <Col key={idx} xs={24} md={8}>
              <Card className="bg-gray-900/30 border border-gray-800" title={<span className="text-gray-300 text-sm">{panel.title}</span>} size="small" bordered={false}>
                <div className="space-y-2">
                  {panel.data.slice(0, 5).map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 truncate flex-1">{d.label}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full bg-${d.color}-500 rounded-full`} style={{ width: `${Math.min(d.value / stats.total * 100, 100)}%` }} />
                        </div>
                        <Tag color={d.color} className="m-0 text-xs">{d.value}</Tag>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 工具栏 */}
        <div className="flex items-center justify-between mb-4">
          <Space>
            <Button.Group className="bg-gray-800 border-gray-700 rounded">
              {(['', 'critical', 'high', 'medium', 'low'] as const).map(lvl => (
                <Button
                  key={lvl}
                  type={levelFilter === lvl ? 'primary' : 'text'}
                  size="small"
                  className={!lvl ? '' : ''}
                  onClick={() => setLevelFilter(lvl)}
                >
                  {!lvl ? '全部' : levelConfig[lvl]?.label}
                </Button>
              ))}
            </Button.Group>
            <span className="text-sm text-gray-500">显示 {filteredAlerts.length} 条告警</span>
          </Space>
          <Badge status="processing" text={<span className="text-green-400 text-xs">实时更新中 (每8秒)</span>} />
        </div>

        {/* 告警流式列表 */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
          {filteredAlerts.length === 0 ? (
            <Empty description={<span className="text-gray-500">暂无匹配的告警</span>} className="py-12" />
          ) : (
            filteredAlerts.map(alert => {
              const cfg = levelConfig[alert.level];
              const stCfg = statusConfig[alert.status];
              return (
                <div key={alert.id} className={`border-l-4 ${cfg.bgColor} bg-gray-900/40 backdrop-blur rounded-r-lg p-4 hover:bg-gray-800/60 transition-all`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`${cfg.color}`}>{cfg.icon}</span>
                        <span className={`font-semibold text-sm`} style={{ color: cfg.color }}>{alert.title}</span>
                        <Tag color={stCfg.color as any} className="text-xs ml-2">{stCfg.text}</Tag>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span><ThunderboltOutlined /> {alert.source}</span>
                        <span>{alert.timestamp}</span>
                        {alert.ioc && <code className="bg-red-950/50 text-red-400 px-1.5 py-0.5 rounded text-xs">IOC: {alert.ioc}</code>}
                        {alert.assignee && <span>负责人: {alert.assignee}</span>}
                      </div>
                    </div>
                    <Space size="small" className="shrink-0">
                      {alert.status === 'new' && (
                        <Button size="small" type="primary" ghost onClick={() => handleAcknowledge(alert.id)}>确认</Button>
                      )}
                      {(alert.status === 'new' || alert.status === 'acknowledged') && (
                        <Button size="small" ghost onClick={() => handleAcknowledge(alert.id)} className="border-blue-500 text-blue-400">处理</Button>
                      )}
                      {alert.status !== 'resolved' && (
                        <Button size="small" ghost danger onClick={() => handleResolve(alert.id)}>解决</Button>
                      )}
                      <Button size="small" type="link" className="text-gray-400" icon={<EyeOutlined />} onClick={() => { setSelectedAlert(alert); setDetailVisible(true); }}>详情</Button>
                    </Space>
                  </div>
                </div>
              );
            })
          )}
          <div ref={alertEndRef} />
        </div>

        {/* 详情弹窗 */}
        <Modal title={`告警详情 - ${selectedAlert?.id || ''}`} open={detailVisible} onCancel={() => setDetailVisible(false)} width={650} footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          selectedAlert?.status !== 'resolved' && <Button key="resolve" type="primary" danger onClick={() => { handleResolve(selectedAlert!.id); setDetailVisible(false); }}>标记解决</Button>,
        ]} className="[&_.ant-modal-content]:bg-gray-900 [&_.ant-modal-header]:bg-gray-900 [&_.ant-modal-title]:text-white [&_.ant-modal-close-x]:color-gray-400">
          {selectedAlert && (
            <Descriptions column={1} size="small" className="[&_.ant-descriptions-item-label]:color-gray-400">
              <Descriptions.Item label="告警ID">{selectedAlert.id}</Descriptions.Item>
              <Descriptions.Item label="级别"><Tag color={levelConfig[selectedAlert.level]?.color}>{levelConfig[selectedAlert.level]?.label}</Tag></Descriptions.Item>
              <Descriptions.Item label="来源">{selectedAlert.source} | {selectedAlert.category}</Descriptions.Item>
              <Descriptions.Item label="时间">{selectedAlert.timestamp}</Descriptions.Item>
              <Descriptions.Item label="标题"><span className="font-bold">{selectedAlert.title}</span></Descriptions.Item>
              <Descriptions.Item label="描述">{selectedAlert.description}</Descriptions.Item>
              {selectedAlert.ioc && <Descriptions.Item label="IOC指标"><code className="bg-red-950 text-red-400 px-2 py-1 rounded">{selectedAlert.ioc}</code></Descriptions.Item>}
              <Descriptions.Item label="状态"><Tag color={statusConfig[selectedAlert.status]?.color}>{statusConfig[selectedAlert.status]?.text}</Tag></Descriptions.Item>
              {selectedAlert.assignee && <Descriptions.Item label="负责人">{selectedAlert.assignee}</Descriptions.Item>}
              {selectedAlert.acknowledgedAt && <Descriptions.Item label="确认时间">{selectedAlert.acknowledgedAt}</Descriptions.Item>}
            </Descriptions>
          )}
        </Modal>

        {/* 底部 */}
        <div className="text-center text-xs text-gray-700 mt-6 pt-4 border-t border-gray-800">
          Real-time Alert System v2.0 | Auto-refresh: 8s interval | Total alerts tracked today: {alerts.length + Math.floor(Math.random() * 50)}
        </div>
      </div>
    </AdminLayout>
  );
}
