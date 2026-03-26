"use client";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 500 }}>Access Denied</h1>
      <p style={{ color: "#666" }}>You don't have permission to access this page.</p>
      <Link href="/console" style={{ color: "#3B82F6" }}>Back to Console</Link>
    </div>
  )
}
