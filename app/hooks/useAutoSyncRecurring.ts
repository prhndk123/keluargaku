import { useEffect, useRef } from "react";
import { financesApi, recurringApi } from "@/services/api";
import { useAppNotification } from "@/hooks/useAppNotification";

/**
 * Saat mount: cek RecurringExpenses yang dateSet-nya sudah <= hari ini di bulan berjalan
 * tetapi belum tercatat di Finances (isRecurring=true, description sama, bulan sama).
 * Jika belum ada, insert sebagai expense dan notifikasi.
 */
export function useAutoSyncRecurring(enabled: boolean) {
  const notify = useAppNotification();
  const didRun = useRef(false);

  useEffect(() => {
    if (!enabled || didRun.current) return;
    didRun.current = true;

    (async () => {
      try {
        const now = new Date();
        const today = now.getDate();
        const [recurrings, thisMonthFinances] = await Promise.all([
          recurringApi.list(),
          financesApi.byMonth(now.getFullYear(), now.getMonth()),
        ]);

        const already = new Set(
          thisMonthFinances
            .filter((f) => f.isRecurring)
            .map((f) => f.description.trim().toLowerCase()),
        );

        let synced = 0;
        for (const r of recurrings) {
          if (r.dateSet > today) continue;
          if (already.has(r.description.trim().toLowerCase())) continue;
          const dueDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            Math.min(r.dateSet, 28),
          ).getTime();
          await financesApi.create({
            description: r.description,
            amount: r.amount,
            type: "expense",
            date: dueDate,
            isRecurring: true,
          });
          synced++;
        }
        if (synced > 0) {
          notify(
            "Auto-Sync Tagihan Rutin",
            `${synced} pengeluaran rutin dicatat otomatis bulan ini.`,
          );
        }
      } catch (e) {
        console.error("Auto-sync gagal", e);
      }
    })();
  }, [enabled, notify]);
}
