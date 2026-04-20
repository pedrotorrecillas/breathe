import type { AnchorHTMLAttributes, ReactNode } from "react";

type UnoptimizedLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: ReactNode;
  href?: string;
};

const UnoptimizedLink = ({
  href,
  children,
  ...props
}: UnoptimizedLinkProps) => {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
};

export default UnoptimizedLink;
