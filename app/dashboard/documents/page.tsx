import ShowDocuments from "../components/ShowDocuments";
import { getDashboardData } from "../data";

export default async function DashboardDocumentsPage() {
    const data = await getDashboardData();

    if (!data.success) {
        return (
            <div className="flex flex-col gap-12">
                <ShowDocuments recentDocuments={[]} page="documents" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-12">
            <ShowDocuments
                recentDocuments={data.documents}
                page="documents"
            />
        </div>
    );
}
