import Projects from "../components/Projects";
import { initialProjects } from "../page";

export default function () {
    return (
        <div className="flex flex-col gap-12">
            <Projects projects={initialProjects} page={"projects"} />;
        </div>
    );
}
