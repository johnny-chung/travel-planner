"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, RefreshCw, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";

type Member = { userId: string; name: string; email: string; image: string };
type Expense = {
  _id: string; tripId: string; addedBy: string; description: string;
  date: string; amount: number; currency: string; type: string; createdAt: string;
};

type Props = { tripId: string; tripName: string; currentUserId: string; members: Member[] };

export default function ExpenseDetailClient({ tripId, tripName, currentUserId, members }: Props) {
  const router = useRouter();

  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [amount, setAmount] = useState("");
  const [currency] = useState("CAD");
  const [expenseType, setExpenseType] = useState<"shared" | "own">("shared");
  const [adding, setAdding] = useState(false);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const fetchExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const params = new URLSearchParams();
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      const res = await fetch(`/api/trips/${tripId}/expenses?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setExpenses(data.map(e => ({ ...e, _id: String(e._id) })));
    } catch { toast.error("Failed to load expenses"); }
    finally { setLoadingExpenses(false); }
  }, [tripId, filterFrom, filterTo]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  async function handleAdd() {
    if (!desc.trim() || !amount || isNaN(parseFloat(amount))) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, date, amount: parseFloat(amount), currency, type: expenseType }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setExpenses(prev => [{ ...created, _id: String(created._id) }, ...prev]);
      setDesc(""); setAmount("");
      toast.success("Expense added!");
    } catch { toast.error("Failed to add expense"); }
    finally { setAdding(false); }
  }

  async function handleDelete(expenseId: string) {
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses?expenseId=${expenseId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setExpenses(prev => prev.filter(e => e._id !== expenseId));
      toast.success("Removed");
    } catch { toast.error("Failed to remove"); }
  }

  // Summary calculations
  const sharedExpenses = expenses.filter(e => e.type === "shared" && e.currency === "CAD");
  const myOwnExpenses = expenses.filter(e => e.type === "own" && e.addedBy === currentUserId && e.currency === "CAD");
  const totalShared = sharedExpenses.reduce((s, e) => s + e.amount, 0);
  const totalOwn = myOwnExpenses.reduce((s, e) => s + e.amount, 0);
  const splitPerPerson = members.length > 0 ? totalShared / members.length : 0;
  const myTotal = totalOwn + splitPerPerson;

  function getPaidShared(uid: string) {
    return sharedExpenses.filter(e => e.addedBy === uid).reduce((s, e) => s + e.amount, 0);
  }
  function getMemberName(uid: string) {
    return members.find(m => m.userId === uid)?.name ?? uid;
  }

  return (
    <div className="h-screen flex flex-col bg-background pb-16 md:pb-0 md:pt-16 overflow-hidden">
      <div className="bg-blue-600 text-white px-4 pb-4 md:pb-6 shrink-0"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}>
        <div className="max-w-2xl mx-auto">
          <button onClick={() => router.push("/expense")} className="flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Expenses
          </button>
          <h1 className="text-xl font-bold">{tripName}</h1>
          <p className="text-blue-200 text-sm mt-0.5">Expense Tracker</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden max-w-2xl mx-auto w-full">
        <Tabs defaultValue="add" className="h-full flex flex-col">
          <TabsList className="mx-auto mt-3 w-[280px] grid grid-cols-3 rounded-2xl bg-muted shrink-0">
            <TabsTrigger value="add" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground">Add</TabsTrigger>
            <TabsTrigger value="all" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground">All</TabsTrigger>
            <TabsTrigger value="summary" className="rounded-xl data-[state=active]:bg-card data-[state=active]:text-foreground">Summary</TabsTrigger>
          </TabsList>

          {/* ── Add tab ── */}
          <TabsContent value="add" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border space-y-4">
              {/* Type toggle */}
              <div className="space-y-2">
                <Label>Expense Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpenseType("shared")}
                    className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                      expenseType === "shared"
                        ? "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "border-border bg-card text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    🤝 Shared
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseType("own")}
                    className={`py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                      expenseType === "own"
                        ? "border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        : "border-border bg-card text-muted-foreground hover:border-border/80"
                    }`}
                  >
                    👤 Personal
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {expenseType === "shared"
                    ? "Split equally among all trip members."
                    : "Your own spending — not split with others."}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="e.g. Dinner at Ramen shop" value={desc} onChange={e => setDesc(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl h-11" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" placeholder="0.00" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} className="rounded-xl h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <select value={currency} disabled
                    className="w-full h-11 rounded-xl border border-border bg-muted px-2 text-sm font-medium text-muted-foreground cursor-not-allowed">
                    <option value="CAD">CAD</option>
                  </select>
                </div>
              </div>
              <Button className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={handleAdd} disabled={adding || !desc.trim() || !amount}>
                <Plus className="w-4 h-4" /> {adding ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </TabsContent>

          {/* ── All tab ── */}
          <TabsContent value="all" className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="rounded-xl h-9 text-sm" />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="rounded-xl h-9 text-sm" />
              </div>
              <button onClick={fetchExpenses} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground">
                <RefreshCw className={`w-4 h-4 ${loadingExpenses ? "animate-spin" : ""}`} />
              </button>
            </div>
            {loadingExpenses ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="bg-muted rounded-2xl h-16 animate-pulse" />)}</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No expenses yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map(e => (
                  <div key={e._id} className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-3">
                    <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-base"
                      title={e.type === "own" ? "Personal" : "Shared"}>
                      {e.type === "own" ? "👤" : "🤝"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{e.description}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">{format(new Date(e.date), "MMM d, yyyy")} · by {getMemberName(e.addedBy)}</p>
                    </div>
                    <p className="font-bold text-foreground shrink-0">{e.currency} {e.amount.toFixed(2)}</p>
                    {(e.addedBy === currentUserId) && (
                      <button onClick={() => handleDelete(e._id)} className="p-1.5 text-muted-foreground/60 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Summary tab ── */}
          <TabsContent value="summary" className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Refresh button */}
            <div className="flex justify-end">
              <button onClick={fetchExpenses} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1 px-2 rounded-lg hover:bg-muted transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingExpenses ? "animate-spin" : ""}`} /> Refresh
              </button>
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
                <p className="text-xs text-muted-foreground mb-1">🤝 Total Shared</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">CAD {totalShared.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">÷{members.length} = CAD {splitPerPerson.toFixed(2)}</p>
              </div>
              <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
                <p className="text-xs text-muted-foreground mb-1">👤 My Personal</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">CAD {totalOwn.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Not shared</p>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
              <p className="text-xs text-muted-foreground mb-1">💳 My Total Cost</p>
              <p className="text-2xl font-bold text-foreground">CAD {myTotal.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Personal + my share of group expenses</p>
            </div>

            {/* Balance per person (shared only) */}
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border space-y-3">
              <h3 className="font-semibold text-foreground">Balance per person</h3>
              {members.map(m => {
                const paid = getPaidShared(m.userId);
                const balance = paid - splitPerPerson;
                const isMe = m.userId === currentUserId;
                return (
                  <div key={m.userId} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={m.image} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                        {m.name?.[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{isMe ? "You" : m.name}</p>
                      {isMe
                        ? <p className="text-xs text-muted-foreground">Spending: CAD {paid.toFixed(2)}</p>
                        : <p className="text-xs text-muted-foreground">Paid: CAD {paid.toFixed(2)}</p>
                      }
                    </div>
                    <div className="text-right shrink-0">
                      {isMe ? (
                        balance > 0.005
                          ? <p className="text-sm font-semibold text-green-600">+CAD {balance.toFixed(2)}</p>
                          : balance < -0.005
                            ? <p className="text-sm font-semibold text-red-500">-CAD {Math.abs(balance).toFixed(2)}</p>
                            : <p className="text-sm font-semibold text-muted-foreground">Settled</p>
                      ) : (
                        balance < -0.005 ? (
                          <>
                            <p className="text-sm font-semibold text-orange-500">Owes you</p>
                            <p className="text-xs text-orange-400">CAD {Math.abs(balance).toFixed(2)}</p>
                          </>
                        ) : balance > 0.005 ? (
                          <>
                            <p className="text-sm font-semibold text-blue-500">You owe</p>
                            <p className="text-xs text-blue-400">CAD {balance.toFixed(2)}</p>
                          </>
                        ) : (
                          <p className="text-sm font-semibold text-muted-foreground">Settled</p>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground/60 pt-1">Based on equal split of shared expenses (CAD only)</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
