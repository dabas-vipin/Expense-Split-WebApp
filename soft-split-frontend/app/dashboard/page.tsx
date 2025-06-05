"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, DollarSign, Users, ArrowRight, UserCheck } from "lucide-react";
import { ExpenseCard } from "@/components/expense-card";
import { GroupCard } from "@/components/group-card";
import { BalanceSummary } from "@/components/balance-summary";
import { Expense, Group, Balance, User } from "@/src/contracts";

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [expensesResponse, groupsResponse, balancesResponse, friendsResponse] = await Promise.all([
          api.get("/expenses/user", { params: { limit: 5, page: 1 } }),
          api.get(user?.isAdmin ? "/groups" : `/groups/${user?.id}`),
          api.get("/expenses/balances"),
          api.get("/users/friends/list")
        ]);

        setRecentExpenses(expensesResponse.data?.items || []);
        setGroups(groupsResponse.data || []);
        setBalances(balancesResponse.data || []);
        setFriends(friendsResponse.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Initialize with empty arrays on error
        setRecentExpenses([]);
        setGroups([]);
        setBalances([]);
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">
          Please login to view your dashboard
        </h1>
        <Link href="/login">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col md:flex-row items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user.name}!</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Link href="/expenses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <BalanceSummary balances={balances} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : recentExpenses.length > 0 ? (
              <div className="text-2xl font-bold">{recentExpenses.length}</div>
            ) : null}
          </CardContent>
          <CardFooter>
            <Link
              href="/expenses"
              className="text-xs text-muted-foreground hover:underline"
            >
              View all expenses
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : groups.length > 0 ? (
              <div className="text-2xl font-bold">{groups.length}</div>
            ) : null}
          </CardContent>
          <CardFooter>
            <Link
              href="/groups"
              className="text-xs text-muted-foreground hover:underline"
            >
              View all groups
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="mr-2 h-5 w-5" />
            Friends
          </CardTitle>
          <CardDescription>Your connected friends</CardDescription>
        </CardHeader>
        <CardContent>
          {friends.slice(0, 5).map((friend: any) => (
            <div key={friend.id} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">{friend.name}</p>
                <p className="text-sm text-muted-foreground">{friend.email}</p>
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Link href="/friends" className="w-full">
            <Button variant="outline" className="w-full">
              View All Friends
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
