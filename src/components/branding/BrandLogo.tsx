import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  iconClassName?: string;
  labelClassName?: string;
  size?: number;
  showLabel?: boolean;
  priority?: boolean;
};

export default function BrandLogo({
  className,
  iconClassName,
  labelClassName,
  size = 32,
  showLabel = true,
  priority = false,
}: Props) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/Logo.png"
        alt="Roamer's Ledger logo"
        width={size}
        height={size}
        className={cn("rounded-lg object-cover", iconClassName)}
        priority={priority}
      />
      {showLabel ? (
        <span className={cn("font-bold", labelClassName)}>
          Roamer&apos;s Ledger
        </span>
      ) : null}
    </div>
  );
}
