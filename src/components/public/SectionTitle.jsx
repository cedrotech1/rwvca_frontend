export default function SectionTitle({ title }) {
  return (
    <div className="public-section-title">
      <h2>
        {title}
        <svg className="public-title-underline" width="200" height="15" viewBox="0 0 150 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9C20 1 70 2 147 3" stroke="#6b4423" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </h2>
    </div>
  );
}
