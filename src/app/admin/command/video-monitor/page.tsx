'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Tag, Button, Select, Space, Badge, Table, List, Typography, Input, Progress, Tooltip, Modal, Descriptions, Statistic } from 'antd';
import {
  VideoCameraOutlined,
  DesktopOutlined,
  WifiOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DownloadOutlined,
  FullscreenOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
const { Text } = Typography;

// 监控设备接口
interface MonitorDevice {
  id: string;
  name: string;
  location: string;
  type: 'ipc' | 'nvr' | 'dvr' | 'screen_capture' | 'api_stream';
  status: 'online' | 'offline' | 'recording' | 'error';
  resolution: string;
  fps: number;
  ipAddress: string;
  lastOnline?: string;
  recordingStorage: string; // 存储使用量
  description: string;
}

// 模拟监控设备数据
const mockDevices: MonitorDevice[] = [
  { id: 'CAM-001', name: '交易所大厅-主入口', location: '1F大厅', type: 'ipc', status: 'online', resolution: '4K(3840x2160)', fps: 25, ipAddress: '192.168.10.101', recordingStorage: '680GB / 2TB', description: '大厅主入口高清监控，覆盖前台和访客区域' },
  { id: 'CAM-002', name: '核心机房-A区', location: 'B3机房A', type: 'ipc', status: 'recording', resolution: '1080p(1920x1080)', fps: 30, ipAddress: '192.168.20.11', recordingStorage: '1.2TB / 4TB', description: '服务器机房24小时不间断录像，含温湿度叠加显示' },
  { id: 'CAM-003', name: '核心机房-B区', location: 'B3机房B', type: 'ipc', status: 'online', resolution: '1080p(1920x1080)', fps: 30, ipAddress: '192.168.20.12', recordingStorage: '980GB / 4TB', description: '区块链节点服务器区域监控' },
  { id: 'CAM-004', name: '财务室', location: '5F财务部', type: 'ipc', status: 'recording', resolution: '1080p(1920x1080)', fps: 25, ipAddress: '192.168.50.21', recordingStorage: '420GB / 1TB', description: '财务办公区域监控，满足审计合规要求' },
  { id: 'CAM-005', name: '数据中心-NVR主', location: 'B3监控中心', type: 'nvr', status: 'online', resolution: '-', fps: 0, ipAddress: '192.168.20.100', recordingStorage: '12.5TB / 48TB', description: '主NVR录像机，管理16路IPC摄像头流' },
  { id: 'CAM-006', name: '运维操作台录屏', location: 'B3运维室', type: 'screen_capture', status: 'online', resolution: '2560x1440', fps: 15, ipAddress: '10.0.0.55', recordingStorage: '85GB / 500GB', description: '运维人员操作屏幕录制，用于事后审计追溯' },
  { id: 'CAM-007', name: 'API网关流量可视化', location: '云端-CDN', type: 'api_stream', status: 'online', resolution: '1920x1080', fps: 5, ipAddress: '-', recordingStorage: '实时流(不存储)', description: 'API请求流量实时可视化大屏数据源' },
  { id: 'CAM-008', name: '停车场出入口', location: 'B1停车场', type: 'ipc', status: 'offline', resolution: '1080p(1920x1080)', fps: 0, ipAddress: '192.168.90.5', lastOnline: '2024-06-07 23:45:00', recordingStorage: '-', description: '停车场双通道车牌识别摄像头（当前离线）' },
  { id: 'CAM-009', name: '会议室-大会议厅', location: '6F会议区', type: 'ipc', status: 'online', resolution: '1080p(1920x1080)', fps: 25, ipAddress: '192.168.60.11', recordingStorage: '120GB / 500GB', description: '重要会议全程录像，支持语音同步录制' },
  { id: 'CAM-010', name: '网络边界防火墙面板', location: 'B2网络间', type: 'screen_capture', status: 'error', resolution: '1920x1080', fps: 0, ipAddress: '172.16.0.1', recordingStorage: '-', description: '防火墙管理面板截图采集异常（连接超时）' },
  { id: 'CAM-011', name: '门禁系统联动摄像', location: '各楼层电梯厅', type: 'ipc', status: 'online', resolution: '720p(1280x720)', fps: 15, ipAddress: '192.168.10.200', recordingStorage: '2.1TB / 8TB', description: '与门禁系统联动，刷卡时自动抓拍并录像10秒' },
  { id: 'CAM-012', name: '冷备机房环境监控', location: 'B4冷备间', type: 'ipc', status: 'recording', resolution: '1080p(1920x1080)', fps: 10, ipAddress: '192.168.22.5', recordingStorage: '350GB / 2TB', description: '冷备机房环境及设备状态监控，含烟感/水浸传感器联动' },
];

// 模拟视频画面占位 - 按网格布局
const gridLayouts = [
  [1, 4], // 1x4 单行
  [2, 2], // 2x2 四宫格
  [3, 3], // 3x3 九宫格
  [4, 4], // 4x4 十六宫格
];

export default function VideoMonitorPage() {
  const [gridMode, setGridMode] = useState<[number, number]>([3, 3]);
  const [selectedDevice, setSelectedDevice] = useState<MonitorDevice | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [playbackMode, setPlaybackMode] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2024-06-08');

  const onlineCount = mockDevices.filter(d => d.status === 'online' || d.status === 'recording').length;
  const offlineCount = mockDevices.filter(d => d.status === 'offline').length;
  const errorCount = mockDevices.filter(d => d.status === 'error').length;
  const recordingCount = mockDevices.filter(d => d.status === 'recording').length;

  const filteredDevices = mockDevices.filter(d => !statusFilter || d.status === statusFilter);

  // 视频画面占位组件
  const VideoPlaceholder = ({ device }: { device: MonitorDevice }) => {
    const bgColors: Record<string, string> = {
      online: 'from-gray-800 to-gray-900',
      recording: 'from-red-950 to-gray-900',
      offline: 'from-gray-900 to-black',
      error: 'from-red-950 to-black',
    };
    return (
      <div className={`relative aspect-video bg-gradient-to-br ${bgColors[device.status]} rounded-lg border border-gray-700 overflow-hidden group cursor-pointer hover:border-blue-500 transition-all`} onClick={() => { setSelectedDevice(device); setDetailVisible(true); }}>
        {/* 模拟视频内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <VideoCameraOutlined className={`text-4xl mb-2 ${device.status === 'online' ? 'text-green-500/40' : device.status === 'recording' ? 'text-red-500/60 animate-pulse' : device.status === 'offline' ? 'text-gray-600' : 'text-red-500/40'}`} />
          <span className="text-sm text-gray-500">{device.name}</span>
          {device.status === 'offline' && <span className="text-xs text-red-400 mt-1">信号丢失</span>}
          {device.status === 'error' && <span className="text-xs text-red-400 mt-1">连接异常</span>}
        </div>
        {/* 扫描线效果 */}
        {device.status !== 'offline' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-scan" style={{ animationDuration: `${3 + Math.random() * 2}s` }} />
          </div>
        )}
        {/* 状态指示器 */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <Badge status={device.status === 'online' ? 'success' : device.status === 'recording' ? 'processing' : device.status === 'offline' ? 'default' : 'error'} />
          <span className="text-xs text-gray-400">{device.resolution !== '-' ? device.resolution.split('(')[0] : ''}</span>
        </div>
        {/* 录制指示器 */}
        {device.status === 'recording' && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-900/80 px-2 py-0.5 rounded text-xs text-red-300">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> REC
          </div>
        )}
        {/* 时间戳 */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-600 font-mono">{new Date().toLocaleTimeString('zh-CN', { hour12: false })}</div>
        {/* 设备名称 */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-400 truncate max-w-[60%]">{device.location}</div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#0a0e1a] text-white -m-6 p-6">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <VideoCameraOutlined className="text-3xl text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold m-0 bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">视频监控中心</h1>
              <p className="text-xs text-gray-500">VIDEO SURVEILLANCE & MONITORING SYSTEM</p>
            </div>
          </div>
          <Space>
            <Button icon={playbackMode ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={() => setPlaybackMode(!playbackMode)} className={playbackMode ? 'bg-red-900/50 border-red-700 text-red-300' : 'bg-gray-800 border-gray-700 text-gray-300'}>
              {playbackMode ? '退出回放' : '回放模式'}
            </Button>
            <Button icon={<FullscreenOutlined />} className="bg-gray-800 border-gray-700 text-gray-300">全屏</Button>
            <Button icon={<SettingOutlined />} className="bg-gray-800 border-gray-700 text-gray-300">设置</Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[12, 12]} className="mb-6">
          {[
            { label: '总设备数', value: mockDevices.length, color: '#fff' },
            { label: '在线', value: onlineCount, color: '#16A34A' },
            { label: '录像中', value: recordingCount, color: '#DC2626' },
            { label: '离线', value: offlineCount, color: '#8c8c8c' },
            { label: '异常', value: errorCount, color: '#B91C1C' },
          ].map((item, idx) => (
            <Col key={idx} xs={12} sm={4}>
              <Card className="bg-gray-900/50 border border-gray-700 text-center rounded-lg" bordered={false} size="small">
                <Statistic title={<span className="text-gray-400 text-xs">{item.label}</span>} value={item.value} valueStyle={{ color: item.color }} />
              </Card>
            </Col>
          ))}
        </Row>

        {/* 回放时间轴选择器 */}
        {playbackMode && (
          <Card className="bg-gray-900/30 border border-gray-700 rounded-lg mb-4" bordered={false} size="small">
            <div className="flex items-center gap-4">
              <ClockCircleOutlined className="text-cyan-400" />
              <span className="text-sm text-gray-300">选择回放日期:</span>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-40 bg-gray-800 border-gray-600 text-white" />
              <Select defaultValue="all_day" style={{ width: 140 }} className="[&_.ant-select-selector]:bg-gray-800 [&_*]:text-white" options={[
                { label: '全天 (00:00-24:00)', value: 'all_day' },
                { label: '上午 (08:00-12:00)', value: 'morning' },
                { label: '下午 (14:00-18:00)', value: 'afternoon' },
                { label: '夜间 (20:00-08:00)', value: 'night' },
              ]} />
              <Text type="secondary" className="text-gray-500 text-xs ml-auto">提示: 录像保留期限为30天</Text>
            </div>
          </Card>
        )}

        {/* 工具栏 + 监控网格 */}
        <Card className="bg-gray-900/30 border border-gray-700 rounded-lg" bordered={false}
          title={
            <div className="flex items-center gap-4">
              <span className="text-white font-medium">监控点位</span>
              <Space size={4}>
                {gridLayouts.map(([r, c]) => (
                  <Button key={`${r}x${c}`} size="small" type={(gridMode[0] === r && gridMode[1] === c) ? 'primary' : 'text'} onClick={() => setGridMode([r, c])} className={!((gridMode[0] === r && gridMode[1] === c)) ? 'bg-gray-800 border-gray-600 text-gray-400' : ''}>
                    {r}×{c}
                  </Button>
                ))}
              </Space>
              <Select placeholder="状态筛选" style={{ width: 110 }} allowClear value={statusFilter || undefined} onChange={setStatusFilter} options={[
                { label: '在线', value: 'online' }, { label: '录像中', value: 'recording' }, { label: '离线', value: 'offline' }, { label: '异常', value: 'error' },
              ]} className="[&_.ant-select-selector]:bg-gray-800 [&_*]:text-white" size="small" />
              <span className="text-xs text-gray-500 ml-auto">显示 {Math.min(filteredDevices.length, gridMode[0] * gridMode[1])} / {filteredDevices.length} 个画面</span>
            </div>
          }
        >
          {/* 视频网格 */}
          <div className={`grid gap-2 ${gridMode[0] === 1 ? 'grid-cols-4' : gridMode[0] === 2 ? 'grid-cols-2' : gridMode[0] === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {filteredDevices.slice(0, gridMode[0] * gridMode[1]).map(device => (
              <VideoPlaceholder key={device.id} device={device} />
            ))}
            {Array.from({ length: Math.max(0, gridMode[0] * gridMode[1] - filteredDevices.slice(0, gridMode[0] * gridMode[1]).length) }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-video bg-gray-900/50 rounded-lg border border-dashed border-gray-700 flex items-center justify-center">
                <VideoCameraOutlined className="text-2xl text-gray-700" />
              </div>
            ))}
          </div>
        </Card>

        {/* 设备状态列表 */}
        <Row gutter={[16, 16]} className="mt-6">
          <Col xs={24} lg={16}>
            <Card className="bg-gray-900/30 border border-gray-700 rounded-lg" bordered={false} title={<span className="text-white">设备状态列表</span>} size="small">
              <Table
                dataSource={filteredDevices}
                columns={[
                  { title: '设备ID', dataIndex: 'id', key: 'id', width: 100, render: (id: string) => <code className="text-xs text-cyan-400">{id}</code> },
                  { title: '名称', dataIndex: 'name', key: 'name', render: (name: string) => <span className="font-medium text-sm">{name}</span> },
                  { title: '位置', dataIndex: 'location', key: 'location', width: 100 },
                  { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (t: string) => <Tag color="blue">{{ ipc: 'IPC', nvr: 'NVR', dvr: 'DVR', screen_capture: '录屏', api_stream: '数据流' }[t]}</Tag> },
                  { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (s: string) => <Badge status={{ online: 'success', offline: 'default', recording: 'processing', error: 'error' }[s] as any} text={{ online: '在线', offline: '离线', recording: '录像中', error: '异常' }[s]} /> },
                  { title: '分辨率', dataIndex: 'resolution', key: 'resolution', width: 130, render: (r: string) => r || '-' },
                  { title: '存储', dataIndex: 'recordingStorage', key: 'recordingStorage', ellipsis: true },
                  { title: '操作', key: 'action', width: 160, render: (_: any, d: MonitorDevice) => (
                    <Space size="small">
                      <Button type="link" size="small" className="text-cyan-400" onClick={() => { setSelectedDevice(d); setDetailVisible(true); }}>详情</Button>
                      {d.status !== 'offline' && <Button type="link" size="small" className="text-blue-400"><PlayCircleOutlined /></Button>}
                      <Button type="link" size="small" className="text-green-400"><DownloadOutlined /></Button>
                    </Space>
                  )},
                ]}
                rowKey="id"
                pagination={{ pageSize: 6, size: 'small' }}
                size="small"
                className="[&_.ant-table]:bg-transparent [&_.ant-table-thead_>tr_>th]:bg-gray-800/50 [&_.ant-table-tbody_>tr]:hover:bg-gray-800/30"
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card className="bg-gray-900/30 border border-gray-700 rounded-lg" bordered={false} title={<span className="text-white">存储概览</span>} size="small">
              <div className="space-y-4 mt-2">
                {mockDevices.filter(d => d.recordingStorage.includes('/')).map(d => {
                  const [used, total] = d.recordingStorage.split(' / ');
                  const usedNum = parseFloat(used);
                  const totalNum = parseFloat(total);
                  const percent = (usedNum / totalNum * 100).toFixed(1);
                  return (
                    <div key={d.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300 truncate flex-1 mr-2">{d.name}</span>
                        <span className={`text-xs ${parseFloat(percent) > 80 ? 'text-red-400' : 'text-gray-400'}`}>{percent}%</span>
                      </div>
                      <Progress percent={parseFloat(percent)} size="small" strokeColor={parseFloat(percent) > 80 ? '#DC2626' : '#1677FF'} trailColor="#1a1a2e" format={() => `${used} / ${total}`} />
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="bg-gray-900/30 border border-gray-700 rounded-lg mt-4" bordered={false} title={<span className="text-white">快速操作</span>} size="small">
              <Space direction="vertical" className="w-full" size="middle">
                <Button block icon={<DownloadOutlined />} className="bg-gray-800 border-gray-700 text-gray-300 hover:text-white">批量导出录像</Button>
                <Button block icon={<FileProtectOutlined />} className="bg-gray-800 border-gray-700 text-gray-300 hover:text-white">存储空间清理</Button>
                <Button block icon={<SettingOutlined />} className="bg-gray-800 border-gray-700 text-gray-300 hover:text-white">设备配置管理</Button>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 设备详情弹窗 */}
        <Modal title={`设备详情 - ${selectedDevice?.name || ''}`} open={detailVisible} onCancel={() => setDetailVisible(false)} width={600} footer={<Button onClick={() => setDetailVisible(false)}>关闭</Button>}
          className="[&_.ant-modal-content]:bg-gray-900 [&_.ant-modal-header]:bg-gray-900 [&_.ant-modal-title]:text-white [&_.ant-modal-close-x]:color-gray-400">
          {selectedDevice && (
            <Descriptions column={2} size="small" className="[&_.ant-descriptions-item-label]:color-gray-400">
              <Descriptions.Item label="设备ID">{selectedDevice.id}</Descriptions.Item>
              <Descriptions.Item label="设备名称"><span className="font-bold">{selectedDevice.name}</span></Descriptions.Item>
              <Descriptions.Item label="安装位置">{selectedDevice.location}</Descriptions.Item>
              <Descriptions.Item label="设备类型">{{ ipc: '网络摄像机(IPC)', nvr: '网络录像机(NVR)', dvr: '数字硬盘录像机(DVR)', screen_capture: '屏幕录制', api_stream: 'API数据流' }[selectedDevice.type]}</Descriptions.Item>
              <Descriptions.Item label="IP地址"><code className="text-cyan-400">{selectedDevice.ipAddress}</code></Descriptions.Item>
              <Descriptions.Item label="分辨率">{selectedDevice.resolution || '-'}</Descriptions.Item>
              <Descriptions.Item label="帧率">{selectedDevice.fps > 0 ? `${selectedDevice.fps} FPS` : '-'}</Descriptions.Item>
              <Descriptions.Item label="状态"><Badge status={{ online: 'success', offline: 'default', recording: 'processing', error: 'error' }[selectedDevice.status] as any} text={{ online: '在线', offline: '离线', recording: '录像中', error: '异常' }[selectedDevice.status]} /></Descriptions.Item>
              <Descriptions.Item label="存储使用">{selectedDevice.recordingStorage || '-'}</Descriptions.Item>
              <Descriptions.Item label="最后在线">{selectedDevice.lastOnline || '-'}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>{selectedDevice.description}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        {/* 底部 */}
        <div className="text-center text-xs text-gray-700 mt-6 pt-4 border-t border-gray-800">
          Video Surveillance System v2.0 | Total devices: {mockDevices.length} | Recording retention: 30 days | Stream protocol: RTSP/WebRTC
        </div>
      </div>
    </AdminLayout>
  );
}
