import { Schema, model } from 'mongoose';

const HabitSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    completedDates: {
      type: [Date],
    },
    userId: {
      type: String,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);
export const habitModel = {
  name: 'Habit',
  schema: HabitSchema,
  model: model('Habit', HabitSchema),
};
