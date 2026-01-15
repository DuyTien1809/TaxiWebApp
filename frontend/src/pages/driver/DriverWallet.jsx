import { useState, useEffect } from 'react';
import { getWallet, linkBankAccount, unlinkBankAccount, withdrawWallet, getTransactions } from '../../services/api';

const BANKS = [
  'Vietcombank', 'BIDV', 'Agribank', 'Techcombank', 'VPBank',
  'MB Bank', 'ACB', 'Sacombank', 'TPBank', 'VIB'
];

const transactionTypeConfig = {
  NAP_TIEN: { text: 'Nạp tiền', color: 'text-green-600', icon: '💰', bg: 'bg-green-50' },
  THANH_TOAN: { text: 'Thanh toán', color: 'text-red-600', icon: '💳', bg: 'bg-red-50' },
  HOAN_TIEN: { text: 'Hoàn tiền', color: 'text-blue-600', icon: '↩️', bg: 'bg-blue-50' },
  THU_NHAP: { text: 'Thu nhập', color: 'text-green-600', icon: '🚗', bg: 'bg-green-50' },
  RUT_TIEN: { text: 'Rút tiền', color: 'text-orange-600', icon: '🏦', bg: 'bg-orange-50' },
};

export default function DriverWallet() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLinkBank, setShowLinkBank] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountHolder: '' });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [walletRes, transRes] = await Promise.all([getWallet(), getTransactions()]);
      setWallet(walletRes.data.wallet);
      setTransactions(transRes.data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLinkBank = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountHolder) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const { data } = await linkBankAccount(bankForm);
      setWallet(data.wallet);
      setShowLinkBank(false);
      setBankForm({ bankName: '', accountNumber: '', accountHolder: '' });
      setSuccess('Liên kết tài khoản thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Liên kết thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlinkBank = async () => {
    if (!confirm('Bạn có chắc muốn hủy liên kết tài khoản ngân hàng?')) return;
    setActionLoading(true);
    try {
      const { data } = await unlinkBankAccount();
      setWallet(data.wallet);
      setSuccess('Hủy liên kết thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Hủy liên kết thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 50000) {
      setError('Số tiền rút tối thiểu 50,000đ');
      return;
    }
    if (amount > wallet?.balance) {
      setError('Số dư không đủ');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const { data } = await withdrawWallet({ amount });
      setWallet(data.wallet);
      setShowWithdraw(false);
      setWithdrawAmount('');
      setSuccess(data.message);
      setTimeout(() => setSuccess(''), 5000);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Rút tiền thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">💰</span>
            Ví tài xế
          </h1>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-2 animate-fade-in">
            <span>✅</span> {success}
          </div>
        )}
        {error && !showLinkBank && !showWithdraw && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2 animate-fade-in">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-6 mb-6 text-white shadow-xl animate-fade-in">
          <p className="text-white/70 text-sm mb-1">Số dư khả dụng</p>
          <p className="text-4xl font-bold mb-4">{wallet?.balance?.toLocaleString() || 0}đ</p>
          <div className="flex gap-3">
            <button onClick={() => setShowWithdraw(true)} disabled={!wallet?.isLinked || wallet?.balance < 50000} className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <span>🏦</span> Rút tiền
            </button>
            {wallet?.isLinked ? (
              <button onClick={handleUnlinkBank} disabled={actionLoading} className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                <span>🔓</span> Hủy liên kết
              </button>
            ) : (
              <button onClick={() => setShowLinkBank(true)} className="flex-1 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                <span>🔗</span> Liên kết TK
              </button>
            )}
          </div>
          {!wallet?.isLinked && (
            <p className="text-white/70 text-sm mt-3 text-center">⚠️ Liên kết tài khoản ngân hàng để rút tiền</p>
          )}
        </div>

        {/* Linked Bank */}
        {wallet?.isLinked && (
          <div className="bg-white rounded-2xl p-5 mb-6 shadow-lg animate-fade-in">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><span>🏦</span> Tài khoản nhận tiền</h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
              <p className="font-bold text-gray-800">{wallet.bankAccount.bankName}</p>
              <p className="text-gray-600">{wallet.bankAccount.accountNumber}</p>
              <p className="text-sm text-gray-500">{wallet.bankAccount.accountHolder}</p>
            </div>
          </div>
        )}

        {/* Transactions */}
        <div className="bg-white rounded-2xl p-5 shadow-lg animate-fade-in">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><span>📋</span> Lịch sử giao dịch</h3>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-5xl block mb-3">📭</span>
              <p className="text-gray-500">Chưa có giao dịch nào</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.map((t, i) => {
                const config = transactionTypeConfig[t.type] || { text: t.type, color: 'text-gray-600', icon: '📝', bg: 'bg-gray-50' };
                return (
                  <div key={i} className={`flex items-center justify-between p-4 ${config.bg} rounded-xl`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <p className="font-medium text-gray-800">{config.text}</p>
                        <p className="text-xs text-gray-500">{t.description}</p>
                        <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                    <p className={`font-bold text-lg ${config.color}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}đ
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Link Bank Modal */}
        {showLinkBank && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center">
                <span className="text-5xl block mb-2">🏦</span>
                <h3 className="text-2xl font-bold">Liên kết tài khoản</h3>
              </div>
              <div className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">⚠️ {error}</div>}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngân hàng</label>
                  <select value={bankForm.bankName} onChange={(e) => setBankForm({...bankForm, bankName: e.target.value})} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500">
                    <option value="">Chọn ngân hàng</option>
                    {BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
                  <input type="text" placeholder="Nhập số tài khoản" value={bankForm.accountNumber} onChange={(e) => setBankForm({...bankForm, accountNumber: e.target.value})} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản</label>
                  <input type="text" placeholder="Nhập tên chủ tài khoản" value={bankForm.accountHolder} onChange={(e) => setBankForm({...bankForm, accountHolder: e.target.value})} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowLinkBank(false); setError(''); }} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Hủy</button>
                  <button onClick={handleLinkBank} disabled={actionLoading} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2">
                    {actionLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Liên kết'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Modal */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center">
                <span className="text-5xl block mb-2">🏦</span>
                <h3 className="text-2xl font-bold">Rút tiền</h3>
                <p className="text-white/80 text-sm mt-1">Số dư: {wallet?.balance?.toLocaleString()}đ</p>
              </div>
              <div className="p-6 space-y-4">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">⚠️ {error}</div>}
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-700">Rút về: {wallet?.bankAccount?.bankName} - {wallet?.bankAccount?.accountNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền rút (tối thiểu 50,000đ)</label>
                  <input type="number" placeholder="Nhập số tiền" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-orange-500 text-lg" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[100000, 200000, 500000, wallet?.balance].filter(amt => amt >= 50000 && amt <= wallet?.balance).map(amt => (
                    <button key={amt} onClick={() => setWithdrawAmount(amt.toString())} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${withdrawAmount === amt?.toString() ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-orange-100'}`}>
                      {amt === wallet?.balance ? 'Tất cả' : `${amt?.toLocaleString()}đ`}
                    </button>
                  ))}
                </div>
                {withdrawAmount && (
                  <div className="p-4 bg-orange-50 rounded-xl text-center">
                    <p className="text-sm text-gray-600">Số tiền rút</p>
                    <p className="text-3xl font-bold text-orange-600">{parseInt(withdrawAmount || 0).toLocaleString()}đ</p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setShowWithdraw(false); setError(''); setWithdrawAmount(''); }} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Hủy</button>
                  <button onClick={handleWithdraw} disabled={actionLoading || !withdrawAmount} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
                    {actionLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Rút tiền'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
