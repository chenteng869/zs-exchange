import ClientPage from './ClientPage';

export const metadata = {
  title: '全部交易对 | ZS Exchange - 中萨数字科技交易所',
  description:
    '浏览ZS Exchange所有交易对，包括现货、合约、杠杆交易对，支持搜索、筛选、排序和收藏功能。',
  keywords: '交易对列表,加密货币行情,BTC,ETH,ZS Exchange',
};

export default function Page() {
  return <ClientPage />;
}
