"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useRouter } from "next/navigation";

export function AddExpenseButton() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    router.refresh(); // Refresh server-side data after adding expense
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:glow-btn text-white rounded-xl font-bold transition-all duration-300 shadow-lg shadow-blue-500/20"
      >
        <Zap className="w-4 h-4" />
        + Add Expense
      </button>

      <ExpenseForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
