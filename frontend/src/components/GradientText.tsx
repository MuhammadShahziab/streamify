import type { LucideIcon } from "lucide-react";
import { ShipWheelIcon } from "lucide-react";
import { Link } from "react-router";
import clsx from "clsx";

type Size = "xs" | "sm" | "md" | "lg";
type Align = "left" | "center";

type GradientTextProps = {
  size?: Size;
  align?: Align;
  spin?: boolean;
  gradient?: boolean;
  className?: string;
  textClassName?: string;
  iconClassName?: string;
  to?: string;
  icon?: LucideIcon;
  title: string;
};

const sizeMap: Record<
  Size,
  { gap: string; iconSize: string; textSize: string }
> = {
  xs: { iconSize: "size-4", textSize: "text-lg", gap: "gap-2" },
  sm: { iconSize: "size-6", textSize: "text-xl", gap: "gap-2" },
  md: { iconSize: "size-8", textSize: "text-2xl", gap: "gap-2" },
  lg: { iconSize: "size-9", textSize: "text-3xl", gap: "gap-2" },
};

const GradientText: React.FC<GradientTextProps> = ({
  to,
  size = "lg",
  align = "left",
  spin = true,
  gradient = true,
  className,
  textClassName,
  iconClassName,
  icon: Icon = ShipWheelIcon,
  title = "Streamify",
}) => {
  const { gap, iconSize, textSize } = sizeMap[size];

  const Container: React.ElementType = to ? Link : "div";
  const containerProps = to ? { to } : {};

  return (
    <Container
      {...containerProps}
      className={clsx(
        "flex items-center",
        gap,
        align === "center" && "justify-center",
        className
      )}
    >
      <Icon
        className={clsx(
          iconSize,
          spin && "animate-spin",
          "text-primary",
          iconClassName
        )}
      ></Icon>
      <span className={clsx(textClassName , textSize ,  gradient
            ? "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
            : "text-base-content", "font-bold tracking-wider font-mono" )}>
        {title}
      </span>
    </Container>
  );
};

export default GradientText;
