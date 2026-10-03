import katex from "katex";
import "katex/dist/katex.min.css";

export function TeX({ math, block = false }: { math: string; block?: boolean }) {
  const html = katex.renderToString(math, { displayMode: block, throwOnError: false });
  return block
    ? <div className="overflow-x-auto my-2" dangerouslySetInnerHTML={{ __html: html }} />
    : <span dangerouslySetInnerHTML={{ __html: html }} />;
}
