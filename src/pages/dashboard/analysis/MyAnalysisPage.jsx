import { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { PageHeading } from '../../../components/PageHeading';
import api from '../../../services/api';
import { EmployeeProfileView } from './analysisShared';

export default function MyAnalysisPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/me/analysis', { year });
      setData(res.data || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
  }, [year]);

  return (
    <div className="space-y-6">
      <PageHeading
        title="My Analysis"
        subtitle="View your personal activity and analytics"
        icon={<BarChart2 className="h-6 w-6" />}
        showBack
        backTo="/dashboard"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {data ? (
        <EmployeeProfileView data={data} year={year} onYearChange={setYear} />
      ) : (
        <p className="text-sm text-gray-500">{loading ? 'Loading your analysis...' : 'No data yet'}</p>
      )}
    </div>
  );
}
