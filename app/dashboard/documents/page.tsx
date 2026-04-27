import Documents from "../components/Documents";
import { recentDocuments } from "../page";

export default function () {
    return (
        <div className="flex flex-col gap-12">
            <Documents recentDocuments={recentDocuments} />
        </div>
    );
}
