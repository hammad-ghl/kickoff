import mongoose, { Document, Schema } from 'mongoose';

export type RepositoryStatus = 'pending' | 'indexing' | 'indexed' | 'failed';

export interface IRepository extends Document {
  name: string;
  description?: string;
  githubRepoFullName: string;
  githubBranch: string;
  githubInstallationId?: string;
  status: RepositoryStatus;
  indexedAt?: Date;
  featureCount: number;
  indexingProgress?: {
    currentStep: 'connecting' | 'analyzing_git' | 'generating_summaries' | 'building_index' | 'finalizing';
    clustersProcessed: number;
    totalClusters: number;
  };
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IndexingProgressSchema = new Schema({
  currentStep: {
    type: String,
    enum: ['connecting', 'analyzing_git', 'generating_summaries', 'building_index', 'finalizing'],
  },
  clustersProcessed: { type: Number, default: 0 },
  totalClusters: { type: Number, default: 0 },
}, { _id: false });

const RepositorySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    githubRepoFullName: { type: String, required: true },
    githubBranch: { type: String, required: true, default: 'main' },
    githubInstallationId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'indexing', 'indexed', 'failed'],
      default: 'pending',
    },
    indexedAt: { type: Date },
    featureCount: { type: Number, default: 0 },
    indexingProgress: IndexingProgressSchema,
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IRepository>('Repository', RepositorySchema);
