export default function PageBanner({ title, subtitle, align = 'center', children }) {
  return (
    <section className={`public-banner ${align}`}>
      <div className="public-banner-overlay">
        <div className="text-white">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
          {children}
        </div>
      </div>
    </section>
  );
}
