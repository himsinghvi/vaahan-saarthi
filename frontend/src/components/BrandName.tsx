type Props = {
  className?: string;
  /** Hide "Saarthi" — logo mark only */
  short?: boolean;
};

/** Vaahan Saarthi — 3rd 'a' in Vaahan + last 'i' in Saarthi highlight AI */
export default function BrandName({ className = "", short = false }: Props) {
  return (
    <span className={`brand-name ${className}`.trim()}>
      V<span>a</span><span className="brand-ai" title="AI">a</span>han
      {!short && (
        <>
          {" "}
          Saarth<span className="brand-ai" title="AI">i</span>
        </>
      )}
    </span>
  );
}
