'use client';
import { logger } from '@/lib/logger';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, List, Spin, Alert, DatePicker, Button, Space, message } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard, UserDataCard, RevenueDataCard, TransactionDataCard, NFTDataCard } from '@/components/admin/DataCard';
import { dashboardApi } from '@/services/api';
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');


export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);

  // 计算日期参数
  const dateParams = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return {};
    }
    return {
      startDate: dateRange[0].toISOString(),
      endDate: dateRange[1].toISOString(),
    };
  }, [dateRange]);

  // 获取统计数据
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats', dateParams],
    queryFn: async () => {
      const res = await dashboardApi.getStats(dateParams);
      return res.data;
    },
  });

  // 获取最近活动
  const { data: activitiesData, isLoading: activitiesLoading, refetch: refetchActivities } = useQuery({
    queryKey: ['dashboard-recent-activities', dateParams],
    queryFn: async () => {
      const res = await dashboardApi.getRecentActivities({ ...dateParams, limit: 10 });
      return res.data;
    },
  });

  // 获取用户增长图表数据
  const { data: userGrowthData, isLoading: userGrowthLoading } = useQuery({
    queryKey: ['dashboard-user-growth', dateParams],
    queryFn: async () => {
      const res = await dashboardApi.getChartData({ ...dateParams, type: 'user-growth' });
      return res.data;
    },
  });

  // 获取交易量图表数据
  const { data: transactionData, isLoading: transactionLoading } = useQuery({
    queryKey: ['dashboard-transactions', dateParams],
    queryFn: async () => {
      const res = await dashboardApi.getChartData({ ...dateParams, type: 'transactions' });
      return res.data;
    },
  });

  const stats = statsData || {
    totalUsers: 0,
    totalTransactions: 0,
    totalNFTs: 0,
    totalRevenue: 0,
    userGrowth: 0,
    transactionGrowth: 0,
    nftGrowth: 0,
    revenueGrowth: 0,
  };

  const recentActivities = activitiesData || [];

  // 生成用户增长图表配置（API 返回 [{ date, count }]）
  const userGrowthOption = useMemo(() => {
    const rows: Array<{ date: string; count: number }> = Array.isArray(userGrowthData) ? userGrowthData : [];
    if (rows.length === 0) return {};
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['新增用户'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: rows.map((r) => r.date) },
      yAxis: { type: 'value' },
      series: [{
        name: '新增用户',
        type: 'line',
        smooth: true,
        lineStyle: { width: 2 },
        data: rows.map((r) => r.count),
        itemStyle: { color: '#1677FF' },
        areaStyle: { color: '#1677FF', opacity: 0.3 },
      }],
    };
  }, [userGrowthData]);

  // 生成交易量图表配置（API 返回 [{ date, count, volume }]）
  const transactionOption = useMemo(() => {
    const rows: Array<{ date: string; count: number; volume: number }> = Array.isArray(transactionData) ? transactionData : [];
    if (rows.length === 0) return {};
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['交易笔数'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: rows.map((r) => r.date) },
      yAxis: { type: 'value' },
      series: [{
        name: '交易笔数',
        type: 'bar',
        data: rows.map((r) => r.count),
        itemStyle: { color: '#1677FF' },
      }],
    };
  }, [transactionData]);

  // 收入分布饼图配置
  const revenueOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '收入来源',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold' },
        },
        labelLine: { show: false },
        data: [
          { value: 1048, name: '交易手续费', itemStyle: { color: '#1677FF' } },
          { value: 735, name: 'NFT 销售', itemStyle: { color: '#7C3AED' } },
          { value: 580, name: '质押收益', itemStyle: { color: '#16A34A' } },
          { value: 484, name: 'VIP 订阅', itemStyle: { color: '#F59E0B' } },
          { value: 300, name: '其他', itemStyle: { color: '#06B6D4' } },
        ],
      },
    ],
  };

  // 处理日期选择
  const handleDateChange = (dates: any) => {
    setDateRange(dates);
  };

  // 处理刷新
  const handleRefresh = () => {
    refetchStats();
    refetchActivities();
    message.success('数据已刷新');
  };

  // 数据导出为 Excel
  const exportToExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet([
        {
          '指标': '总用户数',
          '数值': stats.totalUsers,
          '增长率': `${stats.userGrowth}%`,
        },
        {
          '指标': '交易笔数',
          '数值': stats.totalTransactions,
          '增长率': `${stats.transactionGrowth}%`,
        },
        {
          '指标': 'NFT 总量',
          '数值': stats.totalNFTs,
          '增长率': `${stats.nftGrowth}%`,
        },
        {
          '指标': '总收入',
          '数值': `$${stats.totalRevenue}`,
          '增长率': `${stats.revenueGrowth}%`,
        },
      ]);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '统计数据');
      XLSX.writeFile(wb, `dashboard-stats-${dayjs().format('YYYY-MM-DD')}.xlsx`);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
      logger.error(error);
    }
  };

  // 数据导出为 CSV
  const exportToCSV = () => {
    try {
      const csvContent = [
        ['指标', '数值', '增长率'],
        ['总用户数', stats.totalUsers, `${stats.userGrowth}%`],
        ['交易笔数', stats.totalTransactions, `${stats.transactionGrowth}%`],
        ['NFT 总量', stats.totalNFTs, `${stats.nftGrowth}%`],
        ['总收入', `$${stats.totalRevenue}`, `${stats.revenueGrowth}%`],
        [''],
        ['最近活动'],
        ['操作', '用户', '时间', '类型'],
        ...recentActivities.map((item: any) => [
          item.action,
          item.user,
          dayjs(item.time).format('YYYY-MM-DD HH:mm:ss'),
          item.type,
        ]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard-stats-${dayjs().format('YYYY-MM-DD')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
      logger.error(error);
    }
  };

  const isLoading = statsLoading || activitiesLoading || userGrowthLoading || transactionLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 标题和操作栏 */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold m-0">数据概览</h1>
          <Space>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={handleDateChange}
              format="YYYY-MM-DD"
              presets={[
                { label: '今天', value: [dayjs(), dayjs()] },
                { label: '最近7天', value: [dayjs().subtract(7, 'd'), dayjs()] },
                { label: '最近30天', value: [dayjs().subtract(30, 'd'), dayjs()] },
                { label: '最近90天', value: [dayjs().subtract(90, 'd'), dayjs()] },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isLoading}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={exportToExcel}>
              Excel
            </Button>
            <Button icon={<DownloadOutlined />} onClick={exportToCSV}>
              CSV
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <Spin spinning={statsLoading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <UserDataCard
                value={stats.totalUsers}
                trend={stats.userGrowth > 0 ? 'up' : 'down'}
                trendValue={`${Math.abs(stats.userGrowth)}%`}
                description="总用户数量"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <TransactionDataCard
                value={stats.totalTransactions}
                trend={stats.transactionGrowth > 0 ? 'up' : 'down'}
                trendValue={`${Math.abs(stats.transactionGrowth)}%`}
                description="累计交易笔数"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <NFTDataCard
                value={stats.totalNFTs}
                trend={stats.nftGrowth > 0 ? 'up' : 'down'}
                trendValue={`${Math.abs(stats.nftGrowth)}%`}
                description="NFT 总量"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RevenueDataCard
                value={stats.totalRevenue}
                prefix="$"
                trend={stats.revenueGrowth > 0 ? 'up' : 'down'}
                trendValue={`${Math.abs(stats.revenueGrowth)}%`}
                description="平台总收入"
              />
            </Col>
          </Row>
        </Spin>

        {/* 图表区域 */}
        <Spin spinning={userGrowthLoading || transactionLoading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="用户增长趋势" className="h-full">
                <SafeECharts
                  option={userGrowthOption}
                  style={{ height: 300 }}
                  title="用户增长趋势"
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="收入来源分布" className="h-full">
                <SafeECharts option={revenueOption} style={{ height: 300 }} title="收入来源分布" />
              </Card>
            </Col>
          </Row>
        </Spin>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="交易量趋势">
              <SafeECharts
                option={transactionOption}
                style={{ height: 300 }}
                title="交易量趋势"
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined />
                  <span>最近活动</span>
                </div>
              }
            >
              <Spin spinning={activitiesLoading}>
                <List
                  dataSource={recentActivities}
                  renderItem={(item: any) => (
                    <List.Item key={item.id}>
                      <List.Item.Meta
                        avatar={<UserOutlined />}
                        title={<span>{item.action}</span>}
                        description={`${item.user} · ${dayjs(item.time).fromNow()}`}
                      />
                    </List.Item>
                  )}
                  locale={{ emptyText: '暂无活动' }}
                />
              </Spin>
            </Card>
          </Col>
        </Row>

        <Alert
          message="提示"
          description={`当前时间范围: ${dateRange ? `${dateRange[0]?.format('YYYY-MM-DD')} 至 ${dateRange[1]?.format('YYYY-MM-DD')}` : '未设置'}`}
          type="info"
          showIcon
        />
      </div>
    </AdminLayout>
  );
}
