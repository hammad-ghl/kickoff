import mongoose, { Schema, Document } from 'mongoose';

export interface IComponentDef {
  name: string;
  description?: string;
  props?: string[];
  slots?: string[];
  variants?: string[];
  filePath?: string;
  framework?: 'vue' | 'react' | 'svelte' | 'angular' | 'unknown';
}

export interface IUILibrarySource {
  type: 'github';
  owner: string;
  repo: string;
  branch: string;
  componentPath?: string;
  fullName?: string;
}

export interface IUILibrary extends Document {
  name: string;
  description?: string;
  source: IUILibrarySource;
  components: IComponentDef[];
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ComponentDefSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  props: [String],
  slots: [String],
  variants: [String],
  filePath: String,
  framework: { type: String, enum: ['vue', 'react', 'svelte', 'angular', 'unknown'] },
}, { _id: false });

const UILibrarySchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    source: {
      type: { type: String, enum: ['github'], required: true },
      owner: { type: String, required: true },
      repo: { type: String, required: true },
      branch: { type: String, required: true },
      componentPath: String,
      fullName: String,
    },
    components: [ComponentDefSchema],
    lastSyncedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model<IUILibrary>('UILibrary', UILibrarySchema);
