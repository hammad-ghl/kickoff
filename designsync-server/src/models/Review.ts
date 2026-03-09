import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IComponentCheck {
  componentName: string;
  exists: boolean;
  hasIssue: boolean;
  issueDescription?: string;
  propsUsed?: string[];
  propsMissing?: string[];
  slotsUsed?: string[];
  slotsMissing?: string[];
}

export interface ICaseCheck {
  caseName: string;
  status: 'pending' | 'covered' | 'partial' | 'missing' | 'unclear';
  designEvidence?: string;
  notes?: string;
}

export type AnalysisPhase = 'pending' | 'generating_cases' | 'checking_cases' | 'mapping_components' | 'completed' | 'failed';

export interface IReview extends Document {
  projectId: Types.ObjectId;
  title: string;
  description?: string;
  designImages: string[];
  analysisPhase: AnalysisPhase;
  caseChecks: ICaseCheck[];
  componentChecks: IComponentCheck[];
  analysisError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ComponentCheckSchema = new Schema({
  componentName: { type: String, required: true },
  exists: { type: Boolean, default: true },
  hasIssue: { type: Boolean, default: false },
  issueDescription: String,
  propsUsed: [String],
  propsMissing: [String],
  slotsUsed: [String],
  slotsMissing: [String],
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
      enum: ['pending', 'generating_cases', 'checking_cases', 'mapping_components', 'completed', 'failed'],
      default: 'pending',
    },
    caseChecks: [CaseCheckSchema],
    componentChecks: [ComponentCheckSchema],
    analysisError: String,
  },
  { timestamps: true }
);

export default mongoose.model<IReview>('Review', ReviewSchema);
