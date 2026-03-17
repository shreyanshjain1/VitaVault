"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Toaster as Sonner } from "sonner";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-2xl text-sm font-medium transition-all",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:translate-y-[1px]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:opacity-95 hover:shadow-md",
        outline:
          "border border-border/70 bg-background/60 hover:bg-muted/60 hover:border-border",
        secondary:
          "bg-secondary text-secondary-foreground hover:opacity-90 hover:shadow-sm",
        ghost: "hover:bg-muted/60",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:opacity-95",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 rounded-xl",
        lg: "h-11 px-6 rounded-2xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        [
          "rounded-[28px] border border-border/60 bg-card/85",
          "shadow-[0_10px_30px_rgba(15,23,42,0.06)]",
          "backdrop-blur supports-[backdrop-filter]:bg-card/70",
        ].join(" "),
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pb-3", className)} {...props} />
  );
}

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold tracking-tight", className)}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-3", className)} {...props} />;
}

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        [
          "inline-flex items-center gap-1 rounded-full",
          "border border-border/60 bg-background/60 px-2.5 py-1",
          "text-xs font-medium text-foreground/90",
        ].join(" "),
        className
      )}
      {...props}
    />
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        [
          "flex h-10 w-full rounded-2xl border border-input bg-background/60 px-3 py-2 text-sm",
          "shadow-sm outline-none transition",
          "placeholder:text-muted-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        ].join(" "),
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        [
          "flex w-full rounded-2xl border border-input bg-background/60 px-3 py-2 text-sm",
          "shadow-sm outline-none transition",
          "placeholder:text-muted-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        ].join(" "),
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export function Label(
  props: React.LabelHTMLAttributes<HTMLLabelElement>
) {
  return (
    <label
      className={cn("text-sm font-medium text-foreground/90", props.className)}
      {...props}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <select
      className={cn(
        [
          "flex h-10 w-full rounded-2xl border border-input bg-background/60 px-3 py-2 text-sm",
          "shadow-sm outline-none transition",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        ].join(" "),
        props.className
      )}
      {...props}
    />
  );
}

export function Table(
  props: React.TableHTMLAttributes<HTMLTableElement>
) {
  return <table className={cn("w-full text-sm", props.className)} {...props} />;
}
export function THead(
  props: React.HTMLAttributes<HTMLTableSectionElement>
) {
  return (
    <thead
      className={cn("border-b border-border/60", props.className)}
      {...props}
    />
  );
}
export function TBody(
  props: React.HTMLAttributes<HTMLTableSectionElement>
) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", props.className)} {...props} />
  );
}
export function TR(props: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b border-border/40", props.className)} {...props} />;
}
export function TH(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
        props.className
      )}
      {...props}
    />
  );
}
export function TD(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3 align-top", props.className)} {...props} />;
}

export function Toaster() {
  return <Sonner richColors position="top-right" />;
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
      {initials}
    </div>
  );
}