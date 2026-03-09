import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IExpectedCase {
  name: string;
  description: string;
  importance: 'critical' | 'important' | 'nice-to-have';
}

export interface IProject extends Document {
  name: string;
  description?: string;
  uiLibraryIds: Types.ObjectId[];
  prdText?: string;
  expectedCases: IExpectedCase[];
  casesGeneratedFrom: 'prd' | 'image' | 'manual' | null;
  createdAt: Date;
  updatedAt: Date;
}

const ExpectedCaseSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  importance: { 
    type: String, 
    enum: ['critical', 'important', 'nice-to-have'], 
    default: 'important' 
  },
}, { _id: false });

const ProjectSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    uiLibraryIds: [{
      type: Schema.Types.ObjectId,
      ref: 'UILibrary',
    }],
    prdText: { type: String },
    expectedCases: [ExpectedCaseSchema],
    casesGeneratedFrom: { 
      type: String, 
      enum: ['prd', 'image', 'manual', null], 
      default: null 
    },
  },
  { timestamps: true }
);

export default mongoose.model<IProject>('Project', ProjectSchema);
