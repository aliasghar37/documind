import ShowProjects from "../components/ShowProjects";
import { getDashboardData } from "../data";

export default async function DashboardProjectsPage() {
    const data = await getDashboardData();

    if (!data.success) {
        return (
            <div className="flex flex-col gap-12">
                <ShowProjects page="projects" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-12">
            <ShowProjects
                projects={data.projects}
                // documents={data.documents}
                page="projects"
            />
        </div>
    );
}
