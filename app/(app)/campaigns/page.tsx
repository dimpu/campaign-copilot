import { Plus, Search } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CampaignsTable } from "@/components/campaign-list/campaigns-table";
import { StatsStrip } from "@/components/campaign-list/stats-strip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/auth/auth";
import { CAMPAIGN_STATUSES } from "@/lib/constants";
import { listCampaigns } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

interface CampaignsPageProps {
	searchParams: Promise<{
		status?: string;
		q?: string;
		page?: string;
	}>;
}

export default async function CampaignsPage({
	searchParams,
}: CampaignsPageProps) {
	const session = await auth();
	if (!session?.user) redirect("/login");

	const params = await searchParams;
	const status = params.status;
	const q = params.q;
	const page = Number(params.page) || 1;

	const { items: campaigns, total } = await listCampaigns({
		status,
		q,
		page,
		pageSize: 20,
		userId: (session.user as { id: string }).id,
	});

	// Compute stats
	const totalCampaigns = await listCampaigns({
		page: 1,
		pageSize: 1,
		userId: (session.user as { id: string }).id,
	}).then((r) => r.total);

	const draftCount = await listCampaigns({
		status: "draft",
		page: 1,
		pageSize: 1,
		userId: (session.user as { id: string }).id,
	}).then((r) => r.total);

	const publishedCount = await listCampaigns({
		status: "published",
		page: 1,
		pageSize: 1,
		userId: (session.user as { id: string }).id,
	}).then((r) => r.total);

	const activeCount = publishedCount; // Published = active for now

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-text-primary">Campaigns</h1>
					<p className="mt-1 text-sm text-text-muted">
						Manage your affiliate creator campaigns
					</p>
				</div>
				<a href="/campaigns/new">
					<Button className="gradient-primary text-white font-semibold">
						<Plus className="h-4 w-4" />
						New Campaign
					</Button>
				</a>
			</div>

			{/* Stats Strip */}
			<StatsStrip
				totalCampaigns={totalCampaigns}
				draftCount={draftCount}
				publishedCount={publishedCount}
				activeCount={activeCount}
			/>

			{/* Search + Filters */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
					<form>
						<Input
							name="q"
							placeholder="Search campaigns..."
							defaultValue={q ?? ""}
							className="pl-10"
						/>
					</form>
				</div>

				<div className="flex items-center gap-2">
					<a
						href="/campaigns"
						className={cn(
							"rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
							!status
								? "gradient-primary text-white border-transparent"
								: "border-border text-text-secondary hover:text-text-primary hover:bg-bg-card-hover",
						)}
					>
						All
					</a>
					{CAMPAIGN_STATUSES.map((s) => (
						<a
							key={s}
							href={`/campaigns?status=${s}`}
							className={cn(
								"rounded-full px-3 py-1.5 text-xs font-medium transition-colors border capitalize",
								status === s
									? "gradient-primary text-white border-transparent"
									: "border-border text-text-secondary hover:text-text-primary hover:bg-bg-card-hover",
							)}
						>
							{s}
						</a>
					))}
				</div>
			</div>

			{/* Campaigns Table */}
			<Suspense fallback={<CampaignsTable campaigns={[]} isLoading />}>
				<CampaignsTable campaigns={campaigns} />
			</Suspense>

			{/* Pagination info */}
			{total > 0 && (
				<div className="flex items-center justify-between text-sm text-text-muted">
					<span>
						Showing {campaigns.length} of {total} campaigns
					</span>
					{total > 20 && (
						<div className="flex items-center gap-2">
							{page > 1 ? (
								<a
									href={`/campaigns?${new URLSearchParams({
										...(status && { status }),
										...(q && { q }),
										page: String(page - 1),
									}).toString()}`}
									className="inline-flex items-center justify-center gap-2 h-8 rounded-md px-3 text-xs font-medium border border-border bg-transparent hover:bg-bg-card-hover text-text-primary transition-colors"
								>
									Previous
								</a>
							) : (
								<span className="inline-flex items-center justify-center gap-2 h-8 rounded-md px-3 text-xs font-medium border border-border bg-transparent text-text-muted opacity-50">
									Previous
								</span>
							)}
							<span className="px-2 text-sm">Page {page}</span>
							{campaigns.length >= 20 ? (
								<a
									href={`/campaigns?${new URLSearchParams({
										...(status && { status }),
										...(q && { q }),
										page: String(page + 1),
									}).toString()}`}
									className="inline-flex items-center justify-center gap-2 h-8 rounded-md px-3 text-xs font-medium border border-border bg-transparent hover:bg-bg-card-hover text-text-primary transition-colors"
								>
									Next
								</a>
							) : (
								<span className="inline-flex items-center justify-center gap-2 h-8 rounded-md px-3 text-xs font-medium border border-border bg-transparent text-text-muted opacity-50">
									Next
								</span>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
