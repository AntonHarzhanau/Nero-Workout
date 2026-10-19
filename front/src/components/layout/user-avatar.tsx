import { cn } from "cn";
import { Avatar, AvatarFallback } from "../ui/avatar";

type UserAvatarProps = {
  name: string;
  className?: string;
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toLocaleUpperCase("fr");
}

export function UserAvatar({ name, className }: UserAvatarProps) {
  return (
    <Avatar
      aria-hidden="true"
      className={cn("size-9 shrink-0 border border-primary/30", className)}
    >
      <AvatarFallback className="bg-primary/10 text-sm text-primary-foreground/70">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
