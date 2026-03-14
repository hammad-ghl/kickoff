import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRepoFeatureCluster extends Document {
  repositoryId: Types.ObjectId;
  name: string;
  summary: string;
  userFlows: string[];
  constraints: string[];
  dependencies: string[];
  affectedBy: string[];
  filePaths: string[];
  qdrantPointId?: string;
  confidence: 'high' | 'medium' | 'low';
  createdAt: Date;
}

const RepoFeatureClusterSchema: Schema = new Schema(
  {
    repositoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    summary: { type: String, required: true },
    userFlows: [{ type: String }],
    constraints: [{ type: String }],
    dependencies: [{ type: String }],
    affectedBy: [{ type: String }],
    filePaths: [{ type: String, required: true }],
    qdrantPointId: { type: String },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
  },
  { timestamps: true }
);

RepoFeatureClusterSchema.index({ repositoryId: 1, name: 1 });

export default mongoose.model<IRepoFeatureCluster>('RepoFeatureCluster', RepoFeatureClusterSchema);
