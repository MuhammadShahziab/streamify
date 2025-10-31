import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { Loader } from "lucide-react";

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

const VARIANT_MAP = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  accent: "btn-accent",
  neutral: "btn-neutral",
  success: "btn-success",
  info: "btn-info",
  warning: "btn-warning",
  danger: "btn-error",
  outline: "btn-outline",
  ghost: "btn-ghost",
  link: "btn-link",
} as const;

const SIZE_MAP = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
  xl: "btn-xl",
  icon: "btn-square",
} as const;

export type ButtonVariant = keyof typeof VARIANT_MAP;
export type ButtonSize = keyof typeof SIZE_MAP;

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  iconOnly?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type = "button",
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      iconOnly,
      className,
      disabled,
      children,
      ...rest
    },
    ref
  ) => {
    const isIconOnly =
      iconOnly ?? (!children && (leftIcon !== undefined || rightIcon !== undefined));

    const resolvedSize = isIconOnly && size === "md" ? "icon" : size;

    const hasLabel = Boolean(children ?? loadingText);

    const composedClassName = cx(
      "btn inline-flex items-center justify-center gap-2 transition",
      VARIANT_MAP[variant] ?? VARIANT_MAP.primary,
      SIZE_MAP[resolvedSize] ?? "",
      fullWidth && "w-full",
      isIconOnly && resolvedSize !== "icon" && "btn-square",
      className
    );

    const isDisabled = disabled || loading;

    const renderLoader = () => (
      <Loader
        aria-hidden="true"
        className={cx("size-4 animate-spin", hasLabel ? undefined : "mx-auto")}
      />
    );

    const renderIcon = (icon: ReactNode, position: "left" | "right") => (
      <span
        className={cx(
          "inline-flex items-center justify-center",
          position === "left" && hasLabel && "mr-1",
          position === "right" && hasLabel && "ml-1"
        )}
      >
        {icon}
      </span>
    );

    const label = loading
      ? loadingText ?? children
      : children;

    return (
      <button
        ref={ref}
        type={type}
        className={composedClassName}
        disabled={isDisabled}
        {...rest}
      >
        {loading ? (
          <>
            {renderLoader()}
            {label && (
              <span className="inline-flex items-center">{label}</span>
            )}
          </>
        ) : (
          <>
            {leftIcon && renderIcon(leftIcon, "left")}
            {label && (
              <span className="inline-flex items-center">{label}</span>
            )}
            {rightIcon && renderIcon(rightIcon, "right")}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
