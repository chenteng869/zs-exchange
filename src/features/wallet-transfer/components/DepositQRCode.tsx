import { useState } from 'react';
import { DepositAddress } from '../types/transfer.types';
import { shortenAddress, copyText } from '../utils/address';

interface Props {
  address: DepositAddress;
}

export function DepositQRCode({ address }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyText(address.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex flex-col items-center">
        <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mb-4 border-2 border-gray-200">
          <div className="text-gray-400 text-xs text-center">
            <div className="w-32 h-32 border-4 border-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-blue-500 font-mono text-xs">{shortenAddress(address.address, 4, 4)}</span>
            </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-sm mb-2">充值地址</p>
          <p className="font-mono text-blue-600 text-sm break-all max-w-xs">
            {address.address}
          </p>
          {address.memo && (
            <div className="mt-2 p-2 bg-yellow-50 rounded-lg">
              <p className="text-gray-500 text-xs">Memo/标签</p>
              <p className="font-mono text-yellow-600 text-sm">{address.memo}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          {copied ? '已复制' : '复制地址'}
        </button>
      </div>
    </div>
  );
}