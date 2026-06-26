'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Table, Button, Tag, Badge, Space, Row, Col,
  Progress, Modal, Descriptions, Divider, message, Select, Tooltip,
} from 'antd';
import {
  EyeOutlined, DownloadOutlined, DatabaseOutlined, CloudUploadOutlined,
  CheckCircleOutlined, WarningOutlined, LineChartOutlined, BarChartOutlined,
  HddOutlined, ClockCircleOutlined, FilterOutlined, FileTextOutlined,
  SettingOutlined, SyncOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import SafeECharts from '@/components/admin/SafeECharts';

// 设备数据概览（10条）
const mockDeviceData = [
  { id: 'DATA-001', deviceId: 'DEV-001', deviceName: '温湿度传感器-A01', dataType: '时序数据', totalRecords: 28_800_000, todayRecords: 86_400, storageDays: 180, compressionRatio: '78%', dataQuality: 99.9, lastIngestion: '2024-06-08 14:59:58', retentionPolicy: '180天热存储+归档', avgSizePerDay: '48MB' },
  { id: 'DATA-002', deviceId: 'DEV-002', deviceName: '电力计量仪-B02', dataType: '时序数据', totalRecords: 14_400_000, todayRecords: 14_400, storageDays: 365, compressionRatio: '82%', dataQuality: 100, lastIngestion: '2024-06-08 14:59:55', retentionPolicy: '1年热存储+归档', avgSizePerDay: '12MB' },
  { id: 'DATA-003', deviceId: 'DEV-003', deviceName: '门禁控制器-C03', dataType: '事件日志', totalRecords: 520_000, todayRecords: 1200, storageDays: 90, compressionRatio: '65%', dataQuality: 85.2, lastIngestion: '2024-06-07 23:15:33', retentionPolicy: '90天滚动', avgSizePerDay: '2MB' },
  { id: 'DATA-004', deviceId: 'DEV-004', deviceName: '空气质量检测-D04', dataType: '时序数据', totalRecords: 14_400_000, todayRecords: 43_200, storageDays: 90, compressionRatio: '75%', dataQuality: 99.8, lastIngestion: '2024-06-08 14:59:57', retentionPolicy: '90天热存储+归档', avgSizePerDay: '36MB' },
  { id: 'DATA-005', deviceId: 'DEV-005', deviceName: 'UPS电源-E05', dataType: '时序数据', totalRecords: 7_200_000, todayRecords: 7200, storageDays: 365, compressionRatio: '88%', dataQuality: 100, lastIngestion: '2024-06-08 14:59:50', retentionPolicy: '1年热存储+归档', avgSizePerDay: '4MB' },
  { id: 'DATA-006', deviceId: 'DEV-006', deviceName: '摄像头-F06', dataType: '二进制(视频)', totalRecords: 360_000, todayRecords: 3600, storageDays: 30, compressionRatio: '92%*', dataQuality: 99.5, lastIngestion: '2024-06-08 14:59:52', retentionPolicy: '30天循环覆盖', avgSizePerDay: '2.3GB' },
  { id: 'DATA-007', deviceId: 'DEV-007', deviceName: '烟感探测器-G07', dataType: '时序+事件', totalRecords: 57_600_000, todayRecords: 172_800, storageDays: 60, compressionRatio: '70%', dataQuality: 97.3, lastIngestion: '2024-06-08 14:59:59', retentionPolicy: '60天热存储+归档', avgSizePerDay: '96MB' },
  { id: 'DATA-008', deviceId: 'DEV-008', deviceName: '水浸传感器-H08', dataType: '时序数据', totalRecords: 7_200_000, todayRecords: 21_600, storageDays: 180, compressionRatio: '80%', dataQuality: 100, lastIngestion: '2024-06-08 14:59:54', retentionPolicy: '180天热存储+归档', avgSizePerDay: '18MB' },
  { id: 'DATA-009', deviceId: 'DEV-009', deviceName: '振动传感器-I09', dataType: '时序数据', totalRecords: 1_600_000, todayRecords: 4800, storageDays: 90, compressionRatio: '72%', dataQuality: 72.5, lastIngestion: '2024-06-06 18:30:00', retentionPolicy: '90天热存储+归档', avgSizePerDay: '8MB' },
  { id: 'DATA-010', deviceId: 'DEV-010', deviceName: '智能电表-J10', dataType: '时序数据', totalRecords: 14_400_000, todayRecords: 14_400, storageDays: 365, compressionRatio: '85%', dataQuality: 100, lastIngestion: '2024-06-08 14:59:59', retentionPolicy: '1年热存储+归档', avgSizePerDay: '10MB' },
];

// 数据入库趋势
const ingestTrendOption = {
  tooltip:{trigger:'axis'},legend:{data:['今日入库量','异常数据量'],bottom:0},
  grid:{left:'3%',right:'4%',bottom:'12%',containLabel:true},
  xAxis:{type:'category',data:['00:00','04:00','08:00','12:00','14:00','16:00']},
  yAxis:[{type:'value',name:'万条'},{type:'value',name:'异常数'}],
  series:[
    {name:'今日入库量',type:'bar',data:[8.2,6.5,15.3,19.8,17.5,14.2],itemStyle:{color:'#1677FF'},barWidth:'40%'},
    {name:'异常数据量',type:'line',data:[12,8,25,18,32,15],itemStyle:{color:'#DC2626'}},
  ],
};

export default function DeviceDataPage() {
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedData, setSelectedData] = useState<any>(null);

  // 数据质量指示器颜色
  const getQualityColor = (q: number) => q >= 99 ? 'success' : q >= 90 ? 'normal' : q >= 80 ? 'exception' : 'exception';

  const columns = [
    { title:'设备ID',dataIndex:'deviceId',key:'deviceId',width:110,render:(v:string)=><code className="text-xs">{v}</code> },
    { title:'设备名称',dataIndex:'deviceName',key:'deviceName',render:(v:string)=><span className="font-semibold">{v}</span> },
    { title:'数据类型',dataIndex:'dataType',key:'dataType',width:110,render:(t:string)=><Tag color="blue">{t}</Tag> },
    { title:'总记录数',dataIndex:'totalRecords',key:'totalRecords',width:130,render:(v:number)=>v.toLocaleString() },
    { title:'今日入库',dataIndex:'todayRecords',key:'todayRecords',width:110,render:(v:number)=>v.toLocaleString() },
    { title:'存储天数',dataIndex:'storageDays',key:'storageDays',width:90,render:(v:number)=><Tag color={v>=300?'green':v>=90?'blue':'orange'}>{v}天</Tag> },
    { title:'压缩率',dataIndex:'compressionRatio',key:'compressionRatio',width:90,render:(v:string)=><span className="text-green-600">{v}</span> },
    { title:'数据质量',dataIndex:'dataQuality',key:'dataQuality',width:130,render:(q:number)=><Progress percent={Math.round(q)} size="small" status={getQualityColor(q) as any} format={()=><><CheckCircleOutlined />{q}%</>} /> },
    { title:'最后入库',dataIndex:'lastIngestion',key:'lastIngestion',width:155 },
    { title:'保留策略',dataIndex:'retentionPolicy',key:'retentionPolicy',width:160,ellipsis:true },
  ];

  const actions:any[] = [
    { key:'view',label:'详情',icon:<EyeOutlined />,onClick:(r:any)=>{setData(r);setDetailVisible(true);} },
    { key:'export',label:'导出',icon:<DownloadOutlined />,onClick:()=>message.info('正在导出...') },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><DatabaseOutlined className="text-indigo-600" /> 设备数据管理</h1>
            <p className="text-gray-500 mt-1">设备数据管理、时序存储、数据质量监控与生命周期策略</p>
          </div>
          <Space><Button icon={<SyncOutlined />} onClick={()=>message.info('同步中')}>数据同步</Button><Button icon={<DownloadOutlined />} onClick={()=>message.info('批量导出')}>批量导出</Button></Space>
        </div>

        <Row gutter={[16,16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="数据总量" value={'1.46亿'} icon={<HddOutlined />} color="#1677FF" suffix="条" description="全设备累计" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="今日入库" value={'39.93万'} icon={<CloudUploadOutlined />} color="#16A34A" suffix="条" trend="up" trendValue="+8%" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="存储周期" value={180} icon={<ClockCircleOutlined />} color="#7C3AED" suffix="天" description="最长保留" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="数据源数" value={mockDeviceData.length} icon={<DatabaseOutlined />} color="#F59E0B" suffix="个" description="活跃数据源" />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard title="平均压缩率" value={'79.7%'} icon={<BarChartOutlined />} color="#DC2626" description="节省存储空间" />
          </Col>
        </Row>

        <Row gutter={[16,16]}>
          <Col xs={24} lg={16}>
            <DataTable columns={columns} dataSource={mockDeviceData} title="设备数据概览" actions={actions} rowKey="id" pagination={{pageSize:10}} searchPlaceholder="搜索设备名称或ID"/>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="今日数据入库趋势" className="shadow-sm" size="small">
              <SafeECharts option={ingestTrendOption} style={{height:320}} title="入库趋势"/>
            </Card>
          </Col>
        </Row>

        <Modal title={`数据详情 - ${selectedData?.deviceName||''}`} open={detailVisible} onCancel={()=>setDetailVisible(false)} width={700}
          footer={[<Button key="close" onClick={()=>setDetailVisible(false)}>关闭</Button>,<Button key="export" icon={<DownloadOutlined />} onClick={()=>message.success('导出成功')}>导出数据</Button>]}>
          {selectedData && (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="设备ID">{selectedData.deviceId}</Descriptions.Item>
              <Descriptions.Item label="设备名称">{selectedData.deviceName}</Descriptions.Item>
              <Descriptions.Item label="数据类型"><Tag color="blue">{selectedData.dataType}</Tag></Descriptions.Item>
              <Descriptions.Item label="总记录数">{selectedData.totalRecords.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="今日入库">{selectedData.todayRecords.toLocaleString()} 条</Descriptions.Item>
              <Descriptions.Item label="存储天数">{selectedData.storageDays} 天</Descriptions.Item>
              <Descriptions.Item label="压缩率"><span className="text-green-600 font-medium">{selectedData.compressionRatio}</span></Descriptions.Item>
              <Descriptions.Item label="数据质量"><Progress percent={Math.round(selectedData.dataQuality)} format={() => selectedData.dataQuality + '%'} /></Descriptions.Item>
              <Descriptions.Item label="日均大小">{selectedData.avgSizePerDay}</Descriptions.Item>
              <Descriptions.Item label="保留策略">{selectedData.retentionPolicy}</Descriptions.Item>
              <Descriptions.Item label="最后入库" span={2}>{selectedData.lastIngestion}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        <Card className="shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50" size="small">
          <div className="flex items-start gap-3"><CheckCircleOutlined className="text-green-500 text-lg mt-0.5"/><div>
            <h4 className="font-semibold mb-1">高性能时序数据库引擎</h4>
            <p className="text-sm text-gray-600">采用自研时序数据库引擎，支持每秒百万级写入吞吐和毫秒级查询响应。内置列式压缩算法（LZ4+Delta），平均压缩率达 79%。支持冷热数据分层存储与自动化生命周期管理。</p>
          </div></div>
        </Card>
      </div>
    </AdminLayout>
  );
}

function setData(r: any) { /* helper */ }
