import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBoundingBox {
  x: number;      // percentage from left (0-1)
  y: number;      // percentage from top (0-1)
  width: number;  // percentage of image width (0-1)
  height: number; // percentage of image height (0-1)
}

export interface IComponentCheck {
  componentName: string;
  exists: boolean;
  hasIssue: boolean;
  issueDescription?: string;
  propsUsed?: string[];
  propsMissing?: string[];
  slotsUsed?: string[];
  slotsMissing?: string[];
  boundingBox?: IBoundingBox;
}

export interface ICaseCheck {
  caseName: string;
  status: 'pending' | 'covered' | 'partial' | 'missing' | 'unclear';
  designEvidence?: string;
  notes?: string;
}

export type AnalysisPhase = 'pending' | 'generating_cases' | 'checking_cases' | 'mapping_components' | 'impact_analysis' | 'completed' | 'failed';

export interface IRelatedFeature {
  featureName: string;
  relevance: string;
  gap: string;
  severity: 'high' | 'medium' | 'low';
  files: string[];
}

export interface IImpactAnalysis {
  relatedFeatures: IRelatedFeature[];
  summary: string;
  gapsCount: number;
  ranAt: Date;
  repositoryId?: string;
  skipped?: boolean;
  skipReason?: string;
}

export interface IReview extends Document {
  projectId: Types.ObjectId;
  title: string;
  description?: string;
  designImages: string[];
  analysisPhase: AnalysisPhase;
  caseChecks: ICaseCheck[];
  componentChecks: IComponentCheck[];
  impactAnalysis?: IImpactAnalysis;
  analysisError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BoundingBoxSchema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
}, { _id: false });

const ComponentCheckSchema = new Schema({
  componentName: { type: String, required: true },
  exists: { type: Boolean, default: true },
  hasIssue: { type: Boolean, default: false },
  issueDescription: String,
  propsUsed: [String],
  propsMissing: [String],
  slotsUsed: [String],
  slotsMissing: [String],
  boundingBox: BoundingBoxSchema,
}, { _id: false });

const CaseCheckSchema = new Schema({
  caseName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'covered', 'partial', 'missing', 'unclear'], 
    default: 'pending' 
  },
  designEvidence: String,
  notes: String,
}, { _id: false });

const ReviewSchema: Schema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: String,
    designImages: [String],
    analysisPhase: {
      type: String,
      enum: ['pending', 'generating_cases', 'checking_cases', 'mapping_components', 'impact_analysis', 'completed', 'failed'],
      default: 'pending',
    },
    caseChecks: [CaseCheckSchema],
    componentChecks: [ComponentCheckSchema],
    impactAnalysis: {
      relatedFeatures: [{
        featureName: { type: String, required: true },
        relevance: { type: String, required: true },
        gap: { type: String, required: true },
        severity: { type: String, enum: ['high', 'medium', 'low'], required: true },
        files: [{ type: String }],
      }],
      summary: { type: String },
      gapsCount: { type: Number, default: 0 },
      ranAt: { type: Date },
      repositoryId: { type: String },
      skipped: { type: Boolean },
      skipReason: { type: String },
    },
    analysisError: String,
  },
  { timestamps: true }
);

export default mongoose.model<IReview>('Review', ReviewSchema);
