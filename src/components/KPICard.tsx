import { motion } from "framer-motion";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  delay?: number;
  trend?: "up" | "down";
}

export function KPICard({ title, value, subtitle, icon: Icon, color, delay = 0, trend }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-card rounded-xl border border-border p-5 hover:shadow-lg transition-all hover:border-border/80 group"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <div className="flex items-center gap-1">
              {trend === "up" && <ArrowUpRight className="h-3 w-3 text-accent" />}
              {trend === "down" && <ArrowDownRight className="h-3 w-3 text-destructive" />}
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          )}
        </div>
        <div
          className="p-2.5 rounded-xl transition-transform group-hover:scale-110"
          style={{ background: `${color}15` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
}
