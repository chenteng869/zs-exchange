import ClientPage from './ClientPage';

export const metadata = {
  title: '我的订单 | ZS Exchange - 中萨数字科技交易所',
  description:
    '查看ZS Exchange交易订单历史，包括当前委托、历史订单、成交记录和资产流水。',
  keywords: '订单历史,交易记录,委托单,ZS Exchange',
};

export default function Page() {
  return <ClientPage />;
}
