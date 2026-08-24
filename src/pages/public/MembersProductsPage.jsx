import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageBanner from '../../components/public/PageBanner';
import SectionTitle from '../../components/public/SectionTitle';
import { publicApi } from '../../services/api';
import { fileUrl } from '../../services/api/config';

function ProductCard({ product, onOpen }) {
  const images = [product.image1_url, product.image2_url, product.image3_url].filter(Boolean);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % images.length), 3000);
    return () => clearInterval(timer);
  }, [images.length]);

  const description = product.description || '';
  const short = description.length > 100;

  return (
    <article className="bg-white rounded-xl shadow overflow-hidden cursor-pointer hover:-translate-y-1" onClick={() => onOpen(product, images)}>
      <div className="relative">
        <img src={fileUrl(images[index] || product.image1_url)} alt="" className="w-full h-[220px] object-cover p-2.5 rounded-[10px]" />
        {images.length > 1 ? (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, dot) => (
              <button
                key={dot}
                type="button"
                className={`h-2 rounded-full ${dot === index ? 'bg-[#8B4513] w-6' : 'bg-white/50 w-2'}`}
                onClick={(event) => { event.stopPropagation(); setIndex(dot); }}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-base mb-1 uppercase">{product.product_name}</h3>
        <p className="text-[13px] text-[#555] leading-relaxed">
          {short ? `${description.slice(0, 100)}` : description}
          {short ? <span className="text-[#0066cc] font-medium">...read more</span> : null}
        </p>
        <div className="text-sm mt-3 leading-relaxed">
          {product.phone ? <><i className="fas fa-user text-[#8B4513] mr-2" />{product.company_name}<i className="fas fa-phone text-[#8B4513] ml-2.5 mr-2" />{product.phone}</> : null}
          {product.address ? <><i className="fas fa-map-marker-alt text-[#8B4513] ml-2.5 mr-2" />{product.address}</> : null}
        </div>
        <div className="text-sm mt-1">
          {product.email ? <><i className="fas fa-envelope text-[#8B4513] mr-2" />{product.email}</> : null}
          {product.website_url ? <><i className="fas fa-globe text-[#8B4513] ml-2.5 mr-2" /><span className="text-[#8B4513]">Visit Website</span></> : null}
        </div>
      </div>
    </article>
  );
}

export default function MembersProductsPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const perPage = 6;

  useEffect(() => {
    publicApi.memberProducts().then((res) => setItems(res.data || [])).catch(() => {});
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const visible = useMemo(() => items.slice((page - 1) * perPage, page * perPage), [items, page]);

  return (
    <div className="bg-[#f9f9f9]">
      <PageBanner align="left" title="Members Products">
        <p className="max-w-xl text-sm mt-3">
          All products are available for members only. if you are not a member, please <Link to="/membership" className="underline">join us</Link>. so you can enjoy our products.
          <br />
          and your product will available here as well
        </p>
      </PageBanner>
      <section className="max-w-[1200px] mx-auto px-5 py-16">
        <SectionTitle title="Member Products" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {visible.map((item) => (
            <ProductCard
              key={item.product_id || item.id}
              product={item}
              onOpen={(product, images) => setSelected({ product, images })}
            />
          ))}
        </div>
        {!items.length ? <p className="text-center text-gray-500 py-10">No products available at the moment.</p> : null}
        {items.length > perPage ? (
          <div className="flex justify-center gap-2.5 mt-10">
            {page > 1 ? <button type="button" className="px-4 py-2 bg-white border rounded" onClick={() => setPage(page - 1)}>← Previous</button> : null}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button key={num} type="button" className={`px-4 py-2 rounded border ${num === page ? 'bg-[#8B4513] text-white border-[#8B4513]' : 'bg-white'}`} onClick={() => setPage(num)}>
                {num}
              </button>
            ))}
            {page < totalPages ? <button type="button" className="px-4 py-2 bg-white border rounded" onClick={() => setPage(page + 1)}>Next →</button> : null}
          </div>
        ) : null}
      </section>

      {selected ? (
        <div className="fixed inset-0 z-[1000] bg-black/90 overflow-y-auto p-5" onClick={() => setSelected(null)}>
          <button type="button" className="fixed top-8 right-8 text-white text-4xl bg-[#8B4513]/80 w-12 h-12 rounded-full" onClick={() => setSelected(null)}>&times;</button>
          <div className="max-w-[1200px] mx-auto my-8 bg-white rounded-[15px] overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 bg-[#f5f5f5] p-8 flex flex-col gap-4">
                {selected.images.map((src) => (
                  <img key={src} src={fileUrl(src)} alt="" className="w-full max-h-[400px] object-contain rounded-lg bg-white p-2.5" />
                ))}
              </div>
              <div className="flex-1 p-10">
                <h2 className="text-[#8B4513] text-[28px] mb-2">{selected.product.product_name}</h2>
                <p><strong className="text-[#8B4513]">Company:</strong> {selected.product.company_name}</p>
                <p className="my-4 text-justify">{selected.product.description}</p>
                <hr className="my-6" />
                <p><strong className="text-[#8B4513]"><i className="fas fa-phone" /> Phone:</strong> {selected.product.phone || 'N/A'}</p>
                <p><strong className="text-[#8B4513]"><i className="fas fa-envelope" /> Email:</strong> {selected.product.email || 'N/A'}</p>
                <p><strong className="text-[#8B4513]"><i className="fas fa-map-marker-alt" /> Address:</strong> {selected.product.address || 'N/A'}</p>
                <p>
                  <strong className="text-[#8B4513]"><i className="fas fa-globe" /> Website:</strong>{' '}
                  {selected.product.website_url ? <a href={selected.product.website_url} target="_blank" rel="noreferrer" className="text-[#8B4513]">{selected.product.website_url}</a> : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
