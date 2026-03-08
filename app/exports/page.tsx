import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/common";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

const exportsList = [
  { href: "/exports/appointments", title: "Appointments CSV" },
  { href: "/exports/medications", title: "Medications CSV" },
  { href: "/exports/labs", title: "Lab Results CSV" },
  { href: "/exports/vitals", title: "Vitals CSV" }
];

export default function ExportsPage() {
  return <AppShell><PageHeader title="Exports" description="Download clean CSV exports for records you may want to share or archive." /><div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">{exportsList.map(item => <Card key={item.href}><CardHeader><CardTitle>{item.title}</CardTitle><CardDescription>Direct CSV export with your own records only.</CardDescription></CardHeader><CardContent><Link href={item.href}><Button className="w-full">Download</Button></Link></CardContent></Card>)}</div></AppShell>;
}
