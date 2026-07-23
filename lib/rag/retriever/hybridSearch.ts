import { MongoClient, ObjectId } from "mongodb";
import { generateQueryEmbeddings } from "./embeddings";

interface HybridSearchResult {
  chunkId: string;
  content: string;
  summary: string;
  isTable: boolean;
  order: number;
  documentId: string;
  projectId: string;
  rrfScore: number;
  vectorRank: number;
  textRank: number;
}

let client: MongoClient;

function getCollection() {
  if (!client) {
	client = new MongoClient(process.env.DATABASE_URL!);
  }
  return client.db().collection("DocumentChunk");
}

async function singleHybridSearch({
  textQuery,
  queryVector,
  projectId,
  topK,
}: {
  textQuery: string;
  queryVector: number[];
  projectId: string;
  topK: number;
}): Promise<HybridSearchResult[]> {
  const collection = getCollection();
  const projectObjectId = new ObjectId(projectId);

  const pipeline = [
	{
	  $rankFusion: {
		input: {
		  pipelines: {
			vectorSearch: [
			  {
				$vectorSearch: {
				  index: "vector_index",
				  path: "embedding",
				  queryVector,
				  numCandidates: topK * 10,
				  limit: topK,
				  filter: { projectId: projectObjectId },
				},
			  },
			],
			fullTextSearch: [
			  {
				$search: {
				  index: "fulltext_index",
				  compound: {
					filter: {
					  equals: {
						path: "projectId",
						value: projectObjectId,
					  },
					},
					should: {
					  text: {
						query: textQuery,
						path: "content",
					  },
					},
				  },
				},
			  },
			],
		  },
		},
		combination: {
		  weights: {
			vectorSearch: 1.0,
			fullTextSearch: 1.0,
		  },
		},
		scoreDetails: true,
	  },
	},
	{
	  $addFields: {
		scoreDetails: { $meta: "scoreDetails" },
	  },
	},
	{ $limit: topK },
	{
	  $project: {
		_id: 0,
		chunkId: "$_id",
		content: 1,
		summary: 1,
		isTable: 1,
		order: 1,
		documentId: 1,
		projectId: 1,
		scoreDetails: 1,
	  },
	},
  ];

  const batch = await collection.aggregate(pipeline).toArray();

  return batch.map((doc: any) => {
	const details = doc.scoreDetails?.details ?? [];
	const vector = details.find(
	  (d: any) => d.inputPipelineName === "vectorSearch",
	);
	const text = details.find(
	  (d: any) => d.inputPipelineName === "fullTextSearch",
	);

	return {
	  chunkId: doc.chunkId?.toString() ?? "",
	  content: doc.content,
	  summary: doc.summary ?? "",
	  isTable: doc.isTable ?? false,
	  order: doc.order ?? 0,
	  documentId: doc.documentId?.toString() ?? "",
	  projectId: doc.projectId?.toString() ?? "",
	  rrfScore: doc.scoreDetails?.value ?? 0,
	  vectorRank: vector?.rank ?? -1,
	  textRank: text?.rank ?? -1,
	};
  });
}

export async function hybridSearch({
  queries,
  projectId,
  topK = 10,
}: {
  queries: string[];
  projectId: string;
  topK?: number;
}): Promise<{
  success: boolean;
  message?: string;
  data?: HybridSearchResult[];
}> {
  const queriesResp = await generateQueryEmbeddings(queries);
  if (!queriesResp.success || !queriesResp.data?.length) {
	return { success: false, message: queriesResp.message };
  }
  const embeddings = queriesResp.data;

  const allResults = await Promise.all(
	queries.map((q, i) =>
	  singleHybridSearch({
		textQuery: q,
		queryVector: embeddings[i] as number[],
		projectId,
		topK,
	  }),
	),
  );

  const merged = new Map<string, HybridSearchResult>();
  for (const results of allResults) {
	for (const r of results) {
	  const existing = merged.get(r.chunkId);
	  if (existing) {
		existing.rrfScore = Math.max(existing.rrfScore, r.rrfScore);
	  } else {
		merged.set(r.chunkId, { ...r });
	  }
	}
  }

  const resp = [...merged.values()]
	.sort((a, b) => b.rrfScore - a.rrfScore)
	.slice(0, topK);

  return { success: true, data: resp };
}
