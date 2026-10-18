import { useId, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUp,
  ArrowUpRight,
  Banknote,
  Bell,
  Box,
  Check,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  EllipsisVertical,
  Home,
  Landmark,
  ListTodo,
  Plus,
  Route,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type NavigationItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: string;
  expandable?: boolean;
};

const navigation: NavigationItem[] = [
  { label: "Home", icon: Home, active: true },
  { label: "Tasks", icon: ListTodo, badge: "10" },
  { label: "Transactions", icon: ArrowLeftRight },
  { label: "Payments", icon: Banknote, expandable: true },
  { label: "Cards", icon: CreditCard },
  { label: "Capital", icon: CircleDollarSign },
  { label: "Accounts", icon: Landmark, expandable: true },
];

const workflows: NavigationItem[] = [
  { label: "Trake rutes", icon: Route },
  { label: "Payments", icon: ArrowUpRight },
  { label: "Notifications", icon: Bell },
  { label: "Settings", icon: Settings },
];

const accounts = [
  { name: "Credit", balance: "$98,125.50", icon: CreditCard },
  { name: "Treasury", balance: "$6,750,200.00", icon: Landmark },
  { name: "Operations", balance: "$1,592,864.82", icon: Wallet },
];

const transactions = [
  {
    date: "May 21, 2026",
    description: "AWS",
    amount: "-$5,200",
    status: "Pending",
    icon: Box,
  },
  {
    date: "May 20, 2026",
    description: "Client Payment",
    amount: "+$125,000",
    status: "Completed",
    icon: ArrowDownLeft,
  },
  {
    date: "May 19, 2026",
    description: "Payroll",
    amount: "-$85,450",
    status: "Completed",
    icon: Users,
  },
  {
    date: "May 18, 2026",
    description: "Office Supplies",
    amount: "-$1,200",
    status: "Completed",
    icon: ShoppingBag,
  },
];

const balanceCurve =
  "M0 67 C9 67 10 64 17 65 C26 66 27 44 39 47 C50 50 49 59 61 56 C72 53 75 54 84 52 C93 50 91 41 104 43 C116 45 117 34 130 38 C143 42 143 27 155 29 C168 31 168 42 180 38 C192 34 197 35 204 30 C216 22 221 30 231 25 C241 20 245 30 255 25 C266 20 269 15 279 19 C288 23 291 15 302 17 C314 19 315 11 326 13 C339 15 343 7 360 8";

function SidebarRow({
  label,
  icon: Icon,
  active,
  badge,
  expandable,
}: NavigationItem) {
  return (
    <div
      className={`flex h-7 items-center gap-2 rounded-md px-2 ${
        active
          ? "bg-secondary font-medium text-foreground"
          : "text-muted-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.65} />
      <span className="whitespace-nowrap">{label}</span>
      {badge && (
        <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded bg-secondary px-1 text-[9px] font-medium leading-none text-muted-foreground">
          {badge}
        </span>
      )}
      {expandable && (
        <ChevronDown className="ml-auto h-3 w-3" strokeWidth={1.6} />
      )}
    </div>
  );
}

export function DashboardPreview() {
  const gradientId = useId();
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [previewSize, setPreviewSize] = useState({ scale: 1, height: 0 });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const canvas = canvasRef.current;
    if (!viewport || !canvas) return;

    let availableWidth = Number.parseFloat(getComputedStyle(viewport).width);
    let naturalHeight = canvas.offsetHeight;

    const fitPreview = () => {
      const scale = Math.min(1, availableWidth / 660);
      const height = naturalHeight * scale;
      setPreviewSize((current) =>
        current.scale === scale && current.height === height
          ? current
          : { scale, height },
      );
    };

    fitPreview();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === viewport) availableWidth = entry.contentRect.width;
        if (entry.target === canvas) naturalHeight = entry.contentRect.height;
      }
      fitPreview();
    });
    observer.observe(viewport);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      role="img"
      aria-label="Nexora dashboard showing Jane’s business balance, three accounts, and recent transactions."
      className="glass-dashboard overflow-hidden rounded-2xl p-3 font-body md:p-4"
      style={{
        background: "rgba(255, 255, 255, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        boxShadow: "var(--shadow-dashboard)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none select-none overflow-hidden rounded-lg border border-border bg-background text-[11px] text-foreground"
      >
        <div
          ref={viewportRef}
          style={previewSize.scale < 1 ? { height: previewSize.height } : undefined}
        >
        <div
          ref={canvasRef}
          className="min-w-[660px]"
          style={
            previewSize.scale < 1
              ? { transform: `scale(${previewSize.scale})`, transformOrigin: "top left" }
              : undefined
          }
        >
          <div className="flex h-11 items-center border-b border-border bg-background">
            <div className="flex w-40 shrink-0 items-center gap-2 px-4">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-[13px] font-semibold leading-none text-primary-foreground">
                N
              </span>
              <span className="text-xs font-semibold tracking-tight">Nexora</span>
              <ChevronDown
                className="ml-1 h-3 w-3 text-muted-foreground"
                strokeWidth={1.6}
              />
            </div>

            <div className="flex min-w-0 flex-1 items-center gap-4 px-4">
              <div className="flex h-6 w-full max-w-[250px] items-center gap-2 rounded-md border border-border/70 bg-secondary/40 px-2 text-[10px] text-muted-foreground">
                <Search className="h-3 w-3 shrink-0" strokeWidth={1.7} />
                <span>Search</span>
                <span className="ml-auto rounded border border-border/80 bg-background px-1 text-[9px] leading-[14px]">
                  ⌘K
                </span>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-3">
                <span className="flex h-6 items-center gap-1.5 whitespace-nowrap rounded-md border border-border px-2 text-[10px] font-medium">
                  Move Money
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </span>
                <Bell
                  className="h-3.5 w-3.5 text-muted-foreground"
                  strokeWidth={1.6}
                />
                <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-secondary text-[9px] font-semibold text-muted-foreground">
                  JB
                </span>
              </div>
            </div>
          </div>

          <div className="flex">
            <div className="w-40 shrink-0 border-r border-border bg-background p-3">
              <div className="space-y-0.5">
                {navigation.map((item) => (
                  <SidebarRow key={item.label} {...item} />
                ))}
              </div>
              <div className="mb-2 mt-5 px-2 text-[9px] font-medium leading-3 text-muted-foreground">
                Workflows
              </div>
              <div className="space-y-0.5">
                {workflows.map((item) => (
                  <SidebarRow key={item.label} {...item} />
                ))}
              </div>
            </div>

            <div className="min-w-0 flex-1 bg-secondary/30 p-4 lg:p-5">
              <div className="text-sm font-semibold leading-5 tracking-tight">
                Welcome, Jane
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-[10px] leading-3">
                <span className="flex h-5 shrink-0 items-center gap-1 rounded-full bg-accent px-2.5 font-medium text-accent-foreground">
                  <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={2} />
                  Send
                </span>
                {["Request", "Transfer", "Deposit", "Pay Bill", "Create Invoice"].map(
                  (action) => (
                    <span
                      key={action}
                      className="flex h-5 shrink-0 items-center whitespace-nowrap rounded-full border border-border bg-background px-2 font-medium"
                    >
                      {action}
                    </span>
                  ),
                )}
                <span className="ml-auto flex h-5 shrink-0 items-center gap-1.5 pl-2 text-muted-foreground">
                  <SlidersHorizontal className="h-3 w-3" strokeWidth={1.6} />
                  Customize
                </span>
              </div>

              <div className="mt-3 flex items-stretch gap-3">
                <div className="min-w-0 flex-1 basis-0 overflow-hidden rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center gap-1.5 font-medium leading-[14px]">
                    Mercury Balance
                    <span className="flex h-3 w-3 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                      <Check className="h-2 w-2" strokeWidth={2} />
                    </span>
                  </div>
                  <div className="mt-1 whitespace-nowrap text-[24px] font-semibold leading-6 tracking-tight tabular-nums">
                    $8,450,190<span className="text-xs font-normal text-muted-foreground">.32</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2.5 whitespace-nowrap text-[9px] leading-3">
                    <span className="text-muted-foreground">Last 30 Days</span>
                    <span className="flex items-center gap-0.5 text-success">
                      <ArrowUp className="h-2 w-2" strokeWidth={2} />
                      +$1.8M
                    </span>
                    <span className="flex items-center gap-0.5 text-destructive">
                      <ArrowDown className="h-2 w-2" strokeWidth={2} />
                      -$900K
                    </span>
                  </div>
                  <svg
                    viewBox="0 0 360 80"
                    preserveAspectRatio="none"
                    className="mt-1 block h-20 w-full overflow-visible"
                  >
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="hsl(var(--accent))"
                          stopOpacity="0.15"
                        />
                        <stop
                          offset="100%"
                          stopColor="hsl(var(--accent))"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 24 H360 M0 48 H360 M0 72 H360"
                      fill="none"
                      stroke="hsl(var(--border))"
                      strokeOpacity="0.45"
                      strokeWidth="0.5"
                    />
                    <path
                      d={`${balanceCurve} L360 80 L0 80 Z`}
                      fill={`url(#${gradientId})`}
                    />
                    <path
                      d={balanceCurve}
                      fill="none"
                      stroke="hsl(var(--accent))"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </div>

                <div className="min-w-0 flex-1 basis-0 rounded-lg border border-border bg-background p-3">
                  <div className="flex items-center font-medium leading-[14px]">
                    Accounts
                    <div className="ml-auto flex items-center gap-2 text-muted-foreground">
                      <Plus className="h-3 w-3" strokeWidth={1.7} />
                      <EllipsisVertical className="h-3 w-3" strokeWidth={1.7} />
                    </div>
                  </div>
                  <div className="mt-1">
                    {accounts.map(({ name, balance, icon: Icon }) => (
                      <div
                        key={name}
                        className="flex items-center justify-between gap-2 py-3 text-xs leading-[14px]"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <Icon
                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            strokeWidth={1.55}
                          />
                          {name}
                        </span>
                        <span className="whitespace-nowrap font-medium tabular-nums">
                          {balance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="font-semibold leading-4">Recent Transactions</div>
                <table className="mt-1.5 w-full table-fixed border-collapse text-left text-[10px] leading-3">
                  <colgroup>
                    <col className="w-[21%]" />
                    <col className="w-[33%]" />
                    <col className="w-[23%]" />
                    <col className="w-[23%]" />
                  </colgroup>
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="py-1 font-normal">Date</th>
                      <th className="py-1 font-normal">Description</th>
                      <th className="py-1 pr-5 text-right font-normal">Amount</th>
                      <th className="py-1 font-normal">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(({ date, description, amount, status, icon: Icon }) => (
                      <tr key={description} className="border-t border-border/60">
                        <td className="whitespace-nowrap py-1 text-muted-foreground">
                          {date}
                        </td>
                        <td className="py-1 font-medium">
                          <span className="flex items-center gap-1.5 whitespace-nowrap">
                            <Icon
                              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                              strokeWidth={1.6}
                            />
                            {description}
                          </span>
                        </td>
                        <td className="whitespace-nowrap py-1 pr-5 text-right font-medium tabular-nums">
                          {amount}
                        </td>
                        <td className="py-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-1.5 text-[9px] font-medium leading-3 ${
                              status === "Pending"
                                ? "bg-warning/10 text-warning"
                                : "bg-success/10 text-success"
                            }`}
                          >
                            <span className="h-1 w-1 rounded-full bg-current" />
                            {status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
