import { useEffect, useState } from 'react';
import PageBanner from '../../components/public/PageBanner';
import SectionTitle from '../../components/public/SectionTitle';
import { publicApi } from '../../services/api';

function formatFee(category) {
  const fee = category.fees?.[0];
  const amount = Number(fee?.fee_amount ?? 0);
  return amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export default function MembershipPage() {
  const [data, setData] = useState({ categories: [], services: [], attributes: [] });
  const [appSettings, setAppSettings] = useState(null);

  useEffect(() => {
    publicApi.membership().then((res) => setData(res.data || { categories: [], services: [], attributes: [] })).catch(() => {});
    publicApi.membershipApplication().then((res) => setAppSettings(res.data)).catch(() => {});
  }, []);

  const available = (categoryId, serviceId) => {
    const row = (data.attributes || []).find(
      (item) => Number(item.category_id) === Number(categoryId) && Number(item.service_id) === Number(serviceId)
    );
    return Number(row?.is_available) === 1;
  };

  return (
    <div className="bg-white">
      <PageBanner
        title="Membership"
        subtitle="After reading the information of this page, you can contact us (+250) 791-226-612 to become a member of the Rwanda Wood Carvers Association (RWCA), and we will guide you through the process."
        align="left"
      />
      <div className="max-w-[1400px] mx-auto px-4 py-10">
        <SectionTitle title="Categories of Members" />
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-[#6b4423] text-white rounded-xl p-10 shadow">
            <h2 className="text-[1.8rem] font-semibold mb-6 text-justify">Membership Categories</h2>
            <ul className="space-y-4">
              {(data.categories || []).map((category) => (
                <li key={category.category_id} className="pl-6 relative">
                  <span className="absolute left-0 text-xl">•</span>
                  <strong className="block text-[1.1rem] mb-1">{category.category_name} Category:</strong>
                  {category.description}
                </li>
              ))}
              {!data.categories?.length ? <li>No membership categories available at the moment.</li> : null}
            </ul>
            <hr className="my-6 border-white/40" />
            For more information: (+250) 791-226-612
          </div>
          <div className="bg-white rounded-xl p-8 shadow flex items-center justify-center">
            <img src="/tree2.png" alt="Membership Tree" className="max-h-[400px] object-contain" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 shadow overflow-x-auto">
          <h2 className="mb-6 text-[#2c3e50] text-2xl font-semibold">Membership Fee & Benefits</h2>
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-[#6b4423] text-white">
                <th className="p-4 text-left min-w-[300px] border border-white/20">BENEFITS AND SERVICES</th>
                {(data.categories || []).map((category) => (
                  <th key={category.category_id} className="p-4 text-center border border-white/20">{category.category_name}</th>
                ))}
                {!data.categories?.length ? <th className="p-4">No categories</th> : null}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#f8f9fa] font-semibold">
                <td className="p-4 text-left font-bold text-[#2c3e50] border border-[#ddd]">Annual contribution in RWF</td>
                {(data.categories || []).map((category) => (
                  <td key={category.category_id} className="p-4 text-center border border-[#ddd]">{formatFee(category)}</td>
                ))}
              </tr>
              {(data.services || []).map((service, index) => (
                <tr key={service.service_id} className={index % 2 ? 'bg-[#fafafa]' : 'bg-white'}>
                  <td className="p-4 text-left text-sm text-[#555] border border-[#ddd]">{service.service_name}</td>
                  {(data.categories || []).map((category) => (
                    <td key={category.category_id} className="p-4 text-center border border-[#ddd]">
                      {available(category.category_id, service.service_id) ? (
                        <span className="text-[#27ae60] text-2xl font-bold">✓</span>
                      ) : (
                        <span className="text-[#c0392b] text-2xl font-bold">✗</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {appSettings?.is_active && appSettings.application_link ? (
          <div className="text-center mt-12 py-8">
            <a href={appSettings.application_link} target="_blank" rel="noreferrer" className="inline-block bg-[#6b4423] text-white px-12 py-4 rounded-lg font-semibold text-lg shadow">
              Become a Member
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
