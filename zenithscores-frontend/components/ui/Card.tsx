import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "rounded-xl border border-neutral-800 bg-neutral-900 p-4",
                className
            )}
            {...props}
        />
    );
}
