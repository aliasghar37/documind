import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const metricesData = [
    {
        title: 4885,
        description: "Token Usage",
    },
    {
        title: 7,
        description: "Projects Created",
    },
    {
        title: 13,
        description: "Documents Uploaded",
    },
    {
        title: "Free",
        description: "User Type",
    },
];

export default function CardSmall() {
    return (
        <div className="flex flex-col gap-12" >
            <div className="grid grid-cols-4">
                {metricesData.map((data) => {
                    return (
                        <Card
                            key={data.description}
                            size="default"
                            className="mx-auto w-full max-w-sm"
                        >
                            <CardHeader>
                                <CardTitle className="text-2xl text-foreground ">
                                    {data.title}
                                </CardTitle>
                                <CardDescription className="text-lg">
                                    {data.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    );
                })}
            </div>
            <div>
                <Card size="sm" className="mx-auto w-full max-w-sm">
                    <CardHeader>
                        <CardTitle>Product Name</CardTitle>
                        <CardDescription>
                            tag, tag, tag, tag, tag
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p>
                            The card component supports a size prop that can be
                            set to &quot;sm&quot; for a more compact appearance.
                        </p>
                    </CardContent>
                    <CardFooter className="flex ">
                        <Button variant="outline" size="sm" className="w-1/2">
                            Open Project
                        </Button>
                        <Button variant="outline" size="sm" className="w-1/2">
                            Edit Project
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
