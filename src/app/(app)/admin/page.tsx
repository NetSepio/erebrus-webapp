"use client";

import { AdminConsole } from "@/components/v3/admin/AdminConsole";
import { RequireAdmin } from "@/components/v3/app/RequireAdmin";

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminConsole />
    </RequireAdmin>
  );
}